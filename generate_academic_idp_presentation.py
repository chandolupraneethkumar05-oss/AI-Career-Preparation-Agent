import os
import shutil
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ------------------------------------------------------------------------------
# ACADEMIC COLOR PALETTE (Vignan University Academic IDP Theme)
# ------------------------------------------------------------------------------
COLOR_BG_WHITE       = RGBColor(255, 255, 255)   # Crisp White Canvas
COLOR_BG_LIGHT       = RGBColor(248, 250, 252)   # Slate-50 soft ivory/gray
COLOR_NAVY_PRIMARY   = RGBColor(0, 33, 71)       # Oxford / Vignan Navy (#002147)
COLOR_NAVY_MED       = RGBColor(20, 50, 95)      # Medium Navy
COLOR_MAROON_ACCENT  = RGBColor(153, 27, 27)     # University Crimson / Maroon (#991B1B)
COLOR_BLUE_ROYAL     = RGBColor(29, 78, 216)     # Royal Blue (#1D4ED8)
COLOR_BLUE_SOFT      = RGBColor(239, 246, 255)   # Blue-50 container
COLOR_TEXT_PRIMARY   = RGBColor(15, 23, 42)      # Slate-900 (#0F172A)
COLOR_TEXT_MUTED     = RGBColor(71, 85, 105)     # Slate-600 (#475569)
COLOR_TEXT_LIGHT     = RGBColor(100, 116, 139)   # Slate-500 (#64748B)
COLOR_BORDER_SLATE   = RGBColor(203, 213, 225)   # Slate-300 (#CBD5E1)
COLOR_BORDER_LIGHT   = RGBColor(226, 232, 240)   # Slate-200 (#E2E8F0)
COLOR_CARD_FILL      = RGBColor(255, 255, 255)   # Card White
COLOR_CARD_TINT      = RGBColor(241, 245, 249)   # Slate-100 Container
COLOR_GREEN_SUCCESS  = RGBColor(22, 101, 52)     # Emerald Green (#166534)
COLOR_GREEN_TINT     = RGBColor(240, 253, 244)   # Green-50
COLOR_AMBER_ALERT    = RGBColor(180, 83, 9)      # Amber-700 (#B45309)
COLOR_AMBER_TINT     = RGBColor(254, 243, 199)   # Amber-50

FONT_HEADING = "Segoe UI"
FONT_BODY    = "Segoe UI"

def set_slide_background(slide, color=COLOR_BG_WHITE):
    background = slide.background
    fill = background.fill
    fill.solid()
    fill.fore_color.rgb = color

def add_academic_header(slide, title, category="INDUSTRY DEFINED PROJECT (IDP)", subtitle=None):
    # Top breadcrumb category
    tb_cat = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(11.733), Inches(0.28))
    tf_cat = tb_cat.text_frame
    tf_cat.word_wrap = True
    tf_cat.margin_left = tf_cat.margin_top = tf_cat.margin_right = tf_cat.margin_bottom = 0
    p_cat = tf_cat.paragraphs[0]
    p_cat.text = f"VIGNAN UNIVERSITY  •  DEPT. OF AI & ML  •  {category.upper()}"
    p_cat.font.name = FONT_HEADING
    p_cat.font.size = Pt(9.5)
    p_cat.font.bold = True
    p_cat.font.color.rgb = COLOR_MAROON_ACCENT

    # Main Slide Title
    tb_title = slide.shapes.add_textbox(Inches(0.8), Inches(0.68), Inches(11.733), Inches(0.55))
    tf_title = tb_title.text_frame
    tf_title.word_wrap = True
    tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
    p_title = tf_title.paragraphs[0]
    p_title.text = title
    p_title.font.name = FONT_HEADING
    p_title.font.size = Pt(22)
    p_title.font.bold = True
    p_title.font.color.rgb = COLOR_NAVY_PRIMARY

    # Optional Subtitle
    if subtitle:
        tb_sub = slide.shapes.add_textbox(Inches(0.8), Inches(1.24), Inches(11.733), Inches(0.35))
        tf_sub = tb_sub.text_frame
        tf_sub.word_wrap = True
        tf_sub.margin_left = tf_sub.margin_top = tf_sub.margin_right = tf_sub.margin_bottom = 0
        p_sub = tf_sub.paragraphs[0]
        p_sub.text = subtitle
        p_sub.font.name = FONT_BODY
        p_sub.font.size = Pt(11)
        p_sub.font.color.rgb = COLOR_TEXT_MUTED

    # Header Divider Line
    line_top = 1.62 if subtitle else 1.35
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(line_top), Inches(11.733), Inches(0.02))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_BORDER_SLATE
    line.line.fill.background()

def add_academic_footer(slide, slide_num, total_slides=16):
    # Footer Divider Line
    line = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(7.0), Inches(11.733), Inches(0.015))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_BORDER_LIGHT
    line.line.fill.background()

    # Left text: Project Name
    tb_left = slide.shapes.add_textbox(Inches(0.8), Inches(7.05), Inches(5.0), Inches(0.3))
    tf_l = tb_left.text_frame
    tf_l.margin_left = tf_l.margin_top = tf_l.margin_right = tf_l.margin_bottom = 0
    p_l = tf_l.paragraphs[0]
    p_l.text = "AI Career Preparation Agent  |  Academic IDP Prototype"
    p_l.font.name = FONT_BODY
    p_l.font.size = Pt(9)
    p_l.font.color.rgb = COLOR_TEXT_LIGHT

    # Center text: Student & Reg No
    tb_center = slide.shapes.add_textbox(Inches(4.8), Inches(7.05), Inches(4.5), Inches(0.3))
    tf_c = tb_center.text_frame
    tf_c.margin_left = tf_c.margin_top = tf_c.margin_right = tf_c.margin_bottom = 0
    p_c = tf_c.paragraphs[0]
    p_c.alignment = PP_ALIGN.CENTER
    p_c.text = "Chandolu Praneeth Kumar (241FA18483)  |  MLOPS"
    p_c.font.name = FONT_BODY
    p_c.font.size = Pt(9)
    p_c.font.color.rgb = COLOR_TEXT_LIGHT

    # Right text: Slide Number
    tb_right = slide.shapes.add_textbox(Inches(10.0), Inches(7.05), Inches(2.533), Inches(0.3))
    tf_r = tb_right.text_frame
    tf_r.margin_left = tf_r.margin_top = tf_r.margin_right = tf_r.margin_bottom = 0
    p_r = tf_r.paragraphs[0]
    p_r.alignment = PP_ALIGN.RIGHT
    p_r.text = f"Slide {slide_num} of {total_slides}"
    p_r.font.name = FONT_BODY
    p_r.font.size = Pt(9)
    p_r.font.bold = True
    p_r.font.color.rgb = COLOR_MAROON_ACCENT

def add_academic_card(slide, left, top, width, height, bg_color=COLOR_CARD_FILL, border_color=COLOR_BORDER_SLATE, shape_type=MSO_SHAPE.ROUNDED_RECTANGLE):
    card = slide.shapes.add_shape(shape_type, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    if border_color:
        card.line.color.rgb = border_color
        card.line.width = Pt(1)
    else:
        card.line.fill.background()
    return card

def add_bullet_point(tf, bold_title, description, pt_size=10.5, space_after=6, text_color=COLOR_TEXT_PRIMARY):
    p = tf.add_paragraph() if len(tf.paragraphs[0].text) > 0 else tf.paragraphs[0]
    p.space_after = Pt(space_after)
    
    r_bullet = p.add_run()
    r_bullet.text = "▪ "
    r_bullet.font.name = FONT_HEADING
    r_bullet.font.size = Pt(pt_size)
    r_bullet.font.bold = True
    r_bullet.font.color.rgb = COLOR_NAVY_PRIMARY

    r_bold = p.add_run()
    r_bold.text = bold_title + (" " if not bold_title.endswith(" ") else "")
    r_bold.font.name = FONT_HEADING
    r_bold.font.size = Pt(pt_size)
    r_bold.font.bold = True
    r_bold.font.color.rgb = text_color

    r_desc = p.add_run()
    r_desc.text = description
    r_desc.font.name = FONT_BODY
    r_desc.font.size = Pt(pt_size)
    r_desc.font.bold = False
    r_desc.font.color.rgb = COLOR_TEXT_MUTED

def add_badge(slide, left, top, width, height, text, bg_color=COLOR_NAVY_PRIMARY, text_color=COLOR_BG_WHITE, font_size=9):
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    badge.fill.solid()
    badge.fill.fore_color.rgb = bg_color
    badge.line.fill.background()
    tf = badge.text_frame
    tf.word_wrap = False
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = text
    p.alignment = PP_ALIGN.CENTER
    p.font.name = FONT_HEADING
    p.font.size = Pt(font_size)
    p.font.bold = True
    p.font.color.rgb = text_color
    return badge

# ==============================================================================
# SLIDE 1: INDUSTRY DEFINED PROJECT (TITLE SLIDE)
# ==============================================================================
def build_slide_1(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)

    # University Header Top Box
    add_academic_card(slide, Inches(0.8), Inches(0.5), Inches(11.733), Inches(1.15), bg_color=COLOR_NAVY_PRIMARY, border_color=None, shape_type=MSO_SHAPE.RECTANGLE)
    
    tb_u = slide.shapes.add_textbox(Inches(1.0), Inches(0.55), Inches(11.333), Inches(1.0))
    tf_u = tb_u.text_frame
    tf_u.word_wrap = True
    p0 = tf_u.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    p0.text = "VIGNAN'S FOUNDATION FOR SCIENCE, TECHNOLOGY & RESEARCH"
    p0.font.name = FONT_HEADING
    p0.font.size = Pt(15)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_BG_WHITE

    p1 = tf_u.add_paragraph()
    p1.alignment = PP_ALIGN.CENTER
    p1.text = "(Deemed to be University  •  Estd. u/s 3 of UGC Act 1956  •  Accredited by NAAC 'A+' Grade)"
    p1.font.name = FONT_BODY
    p1.font.size = Pt(9.5)
    p1.font.color.rgb = RGBColor(203, 213, 225)

    p2 = tf_u.add_paragraph()
    p2.alignment = PP_ALIGN.CENTER
    p2.text = "DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING"
    p2.font.name = FONT_HEADING
    p2.font.size = Pt(11)
    p2.font.bold = True
    p2.font.color.rgb = RGBColor(254, 240, 138)  # Subtle gold highlight

    # Sub-Banner IDP Review
    add_academic_card(slide, Inches(0.8), Inches(1.7), Inches(11.733), Inches(0.38), bg_color=COLOR_MAROON_ACCENT, border_color=None, shape_type=MSO_SHAPE.RECTANGLE)
    tb_idp = slide.shapes.add_textbox(Inches(1.0), Inches(1.72), Inches(11.333), Inches(0.32))
    p_idp = tb_idp.text_frame.paragraphs[0]
    p_idp.alignment = PP_ALIGN.CENTER
    p_idp.text = "INDUSTRY DEFINED PROJECT (IDP) PRESENTATION  •  ACADEMIC YEAR 2026–2027"
    p_idp.font.name = FONT_HEADING
    p_idp.font.size = Pt(10.5)
    p_idp.font.bold = True
    p_idp.font.color.rgb = COLOR_BG_WHITE

    # Center Project Title Card
    add_academic_card(slide, Inches(0.8), Inches(2.2), Inches(11.733), Inches(2.25), bg_color=COLOR_CARD_TINT, border_color=COLOR_BORDER_SLATE)
    
    tb_title = slide.shapes.add_textbox(Inches(1.0), Inches(2.35), Inches(11.333), Inches(1.95))
    tf_t = tb_title.text_frame
    tf_t.word_wrap = True
    
    pt0 = tf_t.paragraphs[0]
    pt0.alignment = PP_ALIGN.CENTER
    pt0.text = "PROJECT TITLE:"
    pt0.font.name = FONT_HEADING
    pt0.font.size = Pt(11)
    pt0.font.bold = True
    pt0.font.color.rgb = COLOR_MAROON_ACCENT

    pt1 = tf_t.add_paragraph()
    pt1.alignment = PP_ALIGN.CENTER
    pt1.text = "AI CAREER PREPARATION AGENT"
    pt1.font.name = FONT_HEADING
    pt1.font.size = Pt(26)
    pt1.font.bold = True
    pt1.font.color.rgb = COLOR_NAVY_PRIMARY

    pt2 = tf_t.add_paragraph()
    pt2.alignment = PP_ALIGN.CENTER
    pt2.text = "A Connected, Multi-Metric Autonomous Career Coaching & Interview Readiness System"
    pt2.font.name = FONT_BODY
    pt2.font.size = Pt(12)
    pt2.font.color.rgb = COLOR_TEXT_MUTED

    pt3 = tf_t.add_paragraph()
    pt3.alignment = PP_ALIGN.CENTER
    pt3.space_before = Pt(6)
    pt3.text = "Literature Survey Reference: \"AI Interview Preparation Assistant\"  |  Academic Half-Project Prototype"
    pt3.font.name = FONT_BODY
    pt3.font.size = Pt(10)
    pt3.font.bold = True
    pt3.font.color.rgb = COLOR_BLUE_ROYAL

    # Bottom Two Columns: Student vs Guide
    card_w = Inches(5.72)
    card_h = Inches(2.2)
    c_top = Inches(4.6)

    # Left: Student Details
    add_academic_card(slide, Inches(0.8), c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), c_top + Inches(0.15), Inches(2.0), Inches(0.28), "PRESENTED BY", bg_color=COLOR_NAVY_PRIMARY, font_size=9)
    
    tb_s = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.48), card_w - Inches(0.4), Inches(1.6))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    
    add_bullet_point(tf_s, "Student Name:", "Chandolu Praneeth Kumar", pt_size=11, space_after=4)
    add_bullet_point(tf_s, "Regd. Number:", "241FA18483", pt_size=11, space_after=4)
    add_bullet_point(tf_s, "Branch / Dept:", "Artificial Intelligence & Machine Learning", pt_size=10, space_after=4)
    add_bullet_point(tf_s, "Course / Sem:", "MLOPS  •  3rd Year – I Semester", pt_size=10, space_after=4)
    add_bullet_point(tf_s, "Batch:", "[Batch]", pt_size=10, space_after=0)

    # Right: Guide Details
    add_academic_card(slide, Inches(6.813), c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(7.013), c_top + Inches(0.15), Inches(2.4), Inches(0.28), "UNDER THE GUIDANCE OF", bg_color=COLOR_MAROON_ACCENT, font_size=9)
    
    tb_g = slide.shapes.add_textbox(Inches(7.013), c_top + Inches(0.48), card_w - Inches(0.4), Inches(1.6))
    tf_g = tb_g.text_frame
    tf_g.word_wrap = True
    
    add_bullet_point(tf_g, "Faculty Guide:", "[Guide Name]", pt_size=11, space_after=4)
    add_bullet_point(tf_g, "Designation:", "[Guide Designation / Department]", pt_size=10.5, space_after=4)
    add_bullet_point(tf_g, "Department:", "Artificial Intelligence & Machine Learning", pt_size=10, space_after=4)
    add_bullet_point(tf_g, "Institution:", "Vignan University, Vadlamudi, Guntur", pt_size=10, space_after=4)
    add_bullet_point(tf_g, "Project Type:", "Industry Defined Project (IDP)", pt_size=10, space_after=0)

    # Footer note
    tb_fn = slide.shapes.add_textbox(Inches(0.8), Inches(6.9), Inches(11.733), Inches(0.4))
    p_fn = tb_fn.text_frame.paragraphs[0]
    p_fn.alignment = PP_ALIGN.CENTER
    p_fn.text = "Vignan's Foundation for Science, Technology & Research (Deemed to be University), Vadlamudi, Guntur – 522213"
    p_fn.font.name = FONT_BODY
    p_fn.font.size = Pt(9)
    p_fn.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 2: AGENDA
# ==============================================================================
def build_slide_2(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Presentation Agenda", "TABLE OF CONTENTS", "Structured outline of the academic IDP project presentation")
    add_academic_footer(slide, 2)

    agenda_items = [
        ("01", "Introduction & Background", "Campus recruitment landscape & student preparation fragmentation."),
        ("02", "Problem Statement", "Critical limitations of existing disconnected tools & the passive chatbot flaw."),
        ("03", "Project Objectives", "10 core goals of the integrated AI Career Preparation Agent prototype."),
        ("04", "Literature Review & Existing Systems", "Academic foundation based on 'AI Interview Preparation Assistant' survey."),
        ("05", "Limitations of Existing Systems", "Detailed analysis of gaps in current standalone recruitment & mock platforms."),
        ("06", "Proposed System Architecture", "Clean academic block diagram, component hierarchy & client-side flow."),
        ("07", "Agent-Like Decision Making", "Rule-based decision rules, diagnostic evaluation & weakness remediation loop."),
        ("08", "Core Functional Modules", "Deep dive into Mock Interview, ATS Resume Scanner & Skill Gap Analyzer."),
        ("09", "How Our Project Overcomes Limitations", "Direct comparative analysis: standalone tools vs. unified agent coaching."),
        ("10", "Technology Stack & Architecture", "React 19, Vite 8, pure SVG visualization & client-side persistence."),
        ("11", "Implemented Features Checklist", "Comprehensive status of 16 live, verified prototype capabilities."),
        ("12", "Future Scope & Conclusion", "Academic prototype boundaries, Phase 2 roadmap & viva defense summary.")
    ]

    col_w = Inches(5.72)
    card_h = Inches(0.72)
    
    for i, (num, title, desc) in enumerate(agenda_items):
        col = i // 6
        row = i % 6
        c_left = Inches(0.8 + col * 6.013)
        c_top = Inches(1.75 + row * 0.83)

        # Card container
        add_academic_card(slide, c_left, c_top, col_w, card_h, bg_color=COLOR_CARD_TINT, border_color=COLOR_BORDER_LIGHT)
        
        # Number badge
        add_badge(slide, c_left + Inches(0.12), c_top + Inches(0.16), Inches(0.48), Inches(0.38), num, bg_color=COLOR_NAVY_PRIMARY, text_color=COLOR_BG_WHITE, font_size=11)
        
        # Text
        tb = slide.shapes.add_textbox(c_left + Inches(0.7), c_top + Inches(0.08), col_w - Inches(0.8), Inches(0.56))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(11)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_NAVY_PRIMARY

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(9.5)
        p_d.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 3: INTRODUCTION
# ==============================================================================
def build_slide_3(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Introduction & Project Background", "PROJECT CONTEXT", "Bridging the fragmentation in modern undergraduate career & interview preparation")
    add_academic_footer(slide, 3)

    col_w = Inches(3.72)
    card_h = Inches(5.0)
    c_top = Inches(1.75)

    # Column 1: Placement Landscape
    add_academic_card(slide, Inches(0.8), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "THE RECRUITMENT CHALLENGE", bg_color=COLOR_NAVY_PRIMARY, font_size=9.5)
    
    tb1 = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    add_bullet_point(tf1, "Multi-Round Hiring:", "Campus technical placements require multi-faceted competency across Technical Depth, Coding, System Architecture, and HR / STAR Behavioral skills.", pt_size=10.5, space_after=10)
    add_bullet_point(tf1, "High Candidate Volume:", "Undergraduate engineering students face rigorous hiring benchmarks where minor deficits in resume framing or delivery cause elimination.", pt_size=10.5, space_after=10)
    add_bullet_point(tf1, "Preparation Anxiety:", "Students struggle with unstructured preparation without clear benchmarks on where they stand relative to industry role expectations.", pt_size=10.5, space_after=0)

    # Column 2: Fragmented Reality
    add_academic_card(slide, Inches(4.806), c_top, col_w, card_h, bg_color=COLOR_AMBER_TINT, border_color=RGBColor(252, 211, 77))
    add_badge(slide, Inches(5.006), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "THE FRAGMENTED APPROACH", bg_color=COLOR_AMBER_ALERT, font_size=9.5)
    
    tb2 = slide.shapes.add_textbox(Inches(5.006), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    add_bullet_point(tf2, "Isolated Resources:", "Candidates use separate tools for Resume/ATS checks, LeetCode for algorithms, ChatGPT for generic prompts, and spreadsheets for tracking.", pt_size=10.5, space_after=10)
    add_bullet_point(tf2, "Zero Interoperability:", "Data does not flow between tools. Performance in a mock interview never updates resume keywords, nor does ATS deficit guide interview questions.", pt_size=10.5, space_after=10)
    add_bullet_point(tf2, "Decision Paralysis:", "Students ask: 'Where am I weak?' and 'What should I practice next?' with no unified system to provide prescriptive guidance.", pt_size=10.5, space_after=0)

    # Column 3: The Proposed Agent Concept
    add_academic_card(slide, Inches(8.813), c_top, col_w, card_h, bg_color=COLOR_BLUE_SOFT, border_color=RGBColor(191, 219, 254))
    add_badge(slide, Inches(9.013), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "AI CAREER PREPARATION AGENT", bg_color=COLOR_BLUE_ROYAL, font_size=9.5)
    
    tb3 = slide.shapes.add_textbox(Inches(9.013), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    add_bullet_point(tf3, "Integrated Pipeline:", "Unifies Resume ATS Scanning, Adaptive Mock Interviews, Multi-Metric Evaluation, Skill Gap Radar Analysis, and Daily Habit Drills.", pt_size=10.5, space_after=10)
    add_bullet_point(tf3, "Agent Coaching Loop:", "Operates on a continuous cycle: Diagnose Deficits ➔ Prescribe High-Yield Practice ➔ Evaluate Performance ➔ Track Readiness Trajectory.", pt_size=10.5, space_after=10)
    add_bullet_point(tf3, "Academic Prototype:", "Delivered as a lightweight, functional React 19 / Vite 8 prototype engineered for transparent IDP evaluation.", pt_size=10.5, space_after=0)

# ==============================================================================
# SLIDE 4: PROBLEM STATEMENT
# ==============================================================================
def build_slide_4(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Problem Statement", "RESEARCH & PRACTICAL GAPS", "Critical shortcomings of current recruitment preparation tools and methodologies")
    add_academic_footer(slide, 4)

    # Left Column: Specific Deficiencies
    col_l_w = Inches(6.8)
    card_h = Inches(1.15)
    
    problems = [
        ("Disjointed Preparation Ecosystem", "Students must juggle multiple uncoordinated platforms (coding portals, ATS parsers, generic chatbots, and static question banks) without any unified candidate model.", COLOR_MAROON_ACCENT),
        ("The 'Passive Chatbot' Flaw", "Standard conversational LLMs are fundamentally reactive: they only respond to immediate prompts and lack persistent memory, goal orientation, and proactive remediation planning.", COLOR_NAVY_PRIMARY),
        ("The Post-Interview Feedback Vacuum", "Mock tools and company rejections offer binary outcomes without rubric-level explanations across Technical Depth, STAR Communication Structure, and Problem Solving.", COLOR_MAROON_ACCENT),
        ("Absence of Closed-Loop Skill Remediation", "Diagnostic assessments conclude with a raw score. They fail to automatically sequence high-yield drills to address the specific detected competency gaps.", COLOR_NAVY_PRIMARY)
    ]

    for i, (title, desc, badge_col) in enumerate(problems):
        c_top = Inches(1.75 + i * 1.28)
        add_academic_card(slide, Inches(0.8), c_top, col_l_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, Inches(0.95), c_top + Inches(0.12), Inches(3.4), Inches(0.26), title.upper(), bg_color=badge_col, font_size=8.5)
        
        tb = slide.shapes.add_textbox(Inches(0.95), c_top + Inches(0.42), col_l_w - Inches(0.3), Inches(0.68))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_TEXT_MUTED

    # Right Column: The Core Problem Statement Box
    r_left = Inches(7.8)
    r_w = Inches(4.733)
    add_academic_card(slide, r_left, Inches(1.75), r_w, Inches(4.99), bg_color=COLOR_CARD_TINT, border_color=COLOR_NAVY_PRIMARY)
    add_badge(slide, r_left + Inches(0.2), Inches(1.95), r_w - Inches(0.4), Inches(0.35), "CENTRAL RESEARCH QUESTION", bg_color=COLOR_NAVY_PRIMARY, font_size=10)

    tb_r = slide.shapes.add_textbox(r_left + Inches(0.2), Inches(2.45), r_w - Inches(0.4), Inches(4.1))
    tf_r = tb_r.text_frame
    tf_r.word_wrap = True
    
    p0 = tf_r.paragraphs[0]
    p0.text = "\"How can we construct an integrated, lightweight career preparation platform that proactively analyzes candidate readiness, identifies competency gaps, evaluates interview responses against standardized rubrics, and dynamically prescribes tailored practice routines?\""
    p0.font.name = FONT_BODY
    p0.font.size = Pt(11)
    p0.font.italic = True
    p0.font.bold = True
    p0.font.color.rgb = COLOR_NAVY_PRIMARY
    p0.space_after = Pt(14)

    add_bullet_point(tf_r, "Scope of Investigation:", "Addressing student career readiness through an end-to-end client-side prototype combining ATS, mock interviews, and radar analytics.", pt_size=10, space_after=8)
    add_bullet_point(tf_r, "Methodological Focus:", "Rule-based deterministic agent decision logic that operates predictably without external API costs or hallucinations.", pt_size=10, space_after=8)
    add_bullet_point(tf_r, "Academic Target:", "Validate user journey coherence and coaching effectiveness within an IDP prototype framework.", pt_size=10, space_after=0)

# ==============================================================================
# SLIDE 5: OBJECTIVES
# ==============================================================================
def build_slide_5(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Project Objectives", "PROJECT OBJECTIVES & AIMS", "Ten primary goals established for the IDP functional prototype development")
    add_academic_footer(slide, 5)

    objectives = [
        ("01", "Unified Career Preparation Platform", "Develop an interactive, single-page application integrating resume audit, mock interview, and skill remediation into one cohesive workflow."),
        ("02", "Personalized Interview Setup", "Enable multi-dimensional interview configuration across 6 engineering domains, 4 round categories, and 3 progressive difficulty tiers."),
        ("03", "Multi-Metric Answer Evaluation", "Perform prototype-level automated evaluation across 5 standardized rubrics (Technical, Problem Solving, STAR, Relevance, Confidence)."),
        ("04", "Dynamic Skill-Gap Identification", "Map candidate competencies using a zero-dependency SVG Radar Chart and isolate the top 3 deficit bottlenecks needing urgent drill."),
        ("05", "Prototype ATS Resume Scanner", "Implement a client-side resume text analyzer comparing uploaded candidate qualifications against target Job Description requirements."),
        ("06", "Contextual Action Recommendations", "Generate prioritized, prescriptive next-action study recommendations based directly on detected diagnostic weaknesses."),
        ("07", "Gamification & Habit Retention", "Incentivize continuous daily preparation through conceptual drills, XP rewards (+50 XP), level progression, and active 7-day streak tracking."),
        ("08", "Longitudinal Progress Tracking", "Provide historical performance trajectory visualization (+14 pt growth curve) and verifiable milestone achievements in a central dashboard."),
        ("09", "Rule-Based Agent Decision Logic", "Demonstrate transparent, deterministic decision rules for adaptive interview difficulty escalation and tailored practice sequencing."),
        ("10", "End-to-End User Journey", "Deliver an unbroken, fully functional user journey from landing page and mock interview to feedback report and control dashboard.")
    ]

    col_w = Inches(5.72)
    card_h = Inches(0.85)
    
    for i, (num, title, desc) in enumerate(objectives):
        col = i // 5
        row = i % 5
        c_left = Inches(0.8 + col * 6.013)
        c_top = Inches(1.75 + row * 0.98)

        add_academic_card(slide, c_left, c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, c_left + Inches(0.12), c_top + Inches(0.15), Inches(0.48), Inches(0.4), num, bg_color=COLOR_NAVY_PRIMARY, font_size=11)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.7), c_top + Inches(0.08), col_w - Inches(0.8), Inches(0.7))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_t = tf.paragraphs[0]
        p_t.text = title
        p_t.font.name = FONT_HEADING
        p_t.font.size = Pt(10.5)
        p_t.font.bold = True
        p_t.font.color.rgb = COLOR_NAVY_PRIMARY

        p_d = tf.add_paragraph()
        p_d.text = desc
        p_d.font.name = FONT_BODY
        p_d.font.size = Pt(9)
        p_d.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 6: LITERATURE REVIEW / EXISTING SYSTEMS
# ==============================================================================
def build_slide_6(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Literature Review & Existing Systems", "LITERATURE SURVEY", "Academic grounding based on the survey concept: 'AI Interview Preparation Assistant'")
    add_academic_footer(slide, 6)

    # Reference Survey Highlight Banner
    add_academic_card(slide, Inches(0.8), Inches(1.75), Inches(11.733), Inches(0.7), bg_color=COLOR_CARD_TINT, border_color=COLOR_MAROON_ACCENT)
    tb_ref = slide.shapes.add_textbox(Inches(1.0), Inches(1.82), Inches(11.333), Inches(0.55))
    tf_ref = tb_ref.text_frame
    p_r0 = tf_ref.paragraphs[0]
    p_r0.text = "REFERENCE LITERATURE SURVEY: \"AI INTERVIEW PREPARATION ASSISTANT\""
    p_r0.font.name = FONT_HEADING
    p_r0.font.size = Pt(11)
    p_r0.font.bold = True
    p_r0.font.color.rgb = COLOR_MAROON_ACCENT
    p_r1 = tf_ref.add_paragraph()
    p_r1.text = "Survey covers 4 key academic domains: AI Interview Assistance, Question Personalization, Multimodal Response Analysis, and Performance Assessment."
    p_r1.font.name = FONT_BODY
    p_r1.font.size = Pt(9.5)
    p_r1.font.color.rgb = COLOR_TEXT_MUTED

    # 4 Survey Domains Matrix
    domains = [
        ("Pillar 1: AI-Based Interview Assistance", [
            ("Conversational Agents:", "Evolution from rule-based FAQ bots to LLM-driven dialog systems."),
            ("Domain Calibration:", "Prompt engineering to emulate realistic HR and technical interviewers."),
            ("Interactive Simulation:", "Creating realistic pacing, turn-taking, and interview environments.")
        ], COLOR_NAVY_PRIMARY),
        ("Pillar 2: Personalized Question Generation", [
            ("Adaptive Questioning:", "Dynamically tuning question difficulty to candidate background."),
            ("Curated Taxonomies:", "Role-specific question banks spanning SDE, ML, and Data Science."),
            ("Context-Aware Probing:", "Follow-up question generation conditioned on previous answer depth.")
        ], COLOR_BLUE_ROYAL),
        ("Pillar 3: Multimodal Response Analysis", [
            ("Speech Analysis:", "Speech-to-text transcription, acoustic pitch, and speech emotion recognition."),
            ("Computer Vision:", "Webcam-based facial emotion detection, eye contact, and gesture posture."),
            ("Text Structuring:", "Evaluating responses using the STAR (Situation, Task, Action, Result) model.")
        ], COLOR_MAROON_ACCENT),
        ("Pillar 4: Multi-Metric Performance Assessment", [
            ("Standardized Rubrics:", "Scoring Technical Depth, Clarity, Prompt Relevance, and Confidence."),
            ("Skill Gap Diagnosis:", "Quantitative competency mapping to isolate weak functional areas."),
            ("Actionable Feedback:", "Transitioning from generic scores to concrete remediation plans.")
        ], COLOR_GREEN_SUCCESS)
    ]

    card_w = Inches(5.72)
    card_h = Inches(1.95)
    
    for i, (title, points, col) in enumerate(domains):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 6.013)
        c_top = Inches(2.6 + r * 2.1)

        add_academic_card(slide, c_left, c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, c_left + Inches(0.15), c_top + Inches(0.15), card_w - Inches(0.3), Inches(0.28), title.upper(), bg_color=col, font_size=9)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.48), card_w - Inches(0.3), Inches(1.35))
        tf = tb.text_frame
        tf.word_wrap = True
        for b_title, b_desc in points:
            add_bullet_point(tf, b_title, b_desc, pt_size=9.5, space_after=4)

    # Bottom academic positioning note
    tb_pos = slide.shapes.add_textbox(Inches(0.8), Inches(6.8), Inches(11.733), Inches(0.3))
    p_pos = tb_pos.text_frame.paragraphs[0]
    p_pos.text = "Academic Prototype Positioning: Focuses on Pillars 1, 2, and 4 (software logic, evaluation rubrics, and skill-gap loops); Pillar 3 sensor pipelines are retained as Future Scope."
    p_pos.font.name = FONT_BODY
    p_pos.font.size = Pt(9)
    p_pos.font.italic = True
    p_pos.font.color.rgb = COLOR_TEXT_LIGHT

# ==============================================================================
# SLIDE 7: LIMITATIONS OF EXISTING SYSTEMS
# ==============================================================================
def build_slide_7(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Limitations of Existing Systems", "EXISTING APPROACH GAPS", "Six critical structural deficiencies identified across existing commercial & open tools")
    add_academic_footer(slide, 7)

    limitations = [
        ("1. Fragmented Preparation Tools", "Preparation activities are split across separate applications (LeetCode for coding, ChatGPT for Q&A, online PDF scanners for ATS, spreadsheets for tracking) with zero cross-platform data exchange.", COLOR_MAROON_ACCENT),
        ("2. Limited Personalization & Static Sets", "Existing question banks present identical static questions regardless of candidate background. They fail to adapt dynamically based on previous performance or specific candidate weaknesses.", COLOR_NAVY_PRIMARY),
        ("3. Absence of Connected Skill-Gap Loop", "Diagnostic tests conclude by presenting a raw numerical score. They do not automatically analyze the underlying sub-skills or prescribe immediate remedial exercises to fix the deficit.", COLOR_MAROON_ACCENT),
        ("4. Scattered Progress Continuity", "Because practice history is distributed across multiple websites, candidates lack a unified longitudinal view of their true interview readiness or readiness trajectory over time.", COLOR_NAVY_PRIMARY),
        ("5. Resume and Interview Preparation Disconnect", "Resume analysis is treated as an isolated clerical task. Keywords identified as missing in ATS checks are never automatically incorporated as target topics in mock interview sessions.", COLOR_MAROON_ACCENT),
        ("6. Lack of Agent-Like Autonomous Adaptation", "Existing platforms function as passive repositories rather than active coaching agents. They lack autonomous evaluate ➔ diagnose ➔ prescribe ➔ reinforce decision loops.", COLOR_NAVY_PRIMARY)
    ]

    card_w = Inches(5.72)
    card_h = Inches(1.5)
    
    for i, (title, desc, col) in enumerate(limitations):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 6.013)
        c_top = Inches(1.8 + r * 1.68)

        add_academic_card(slide, c_left, c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, c_left + Inches(0.15), c_top + Inches(0.15), card_w - Inches(0.3), Inches(0.28), title.upper(), bg_color=col, font_size=9)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.5), card_w - Inches(0.3), Inches(0.9))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(10)
        p.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 8: PROPOSED SYSTEM ARCHITECTURE (BLOCK DIAGRAM)
# ==============================================================================
def build_slide_8(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Proposed System Architecture", "SYSTEM ARCHITECTURE & BLOCK DIAGRAM", "Tiered academic block diagram depicting data flow from user input to dashboard guidance")
    add_academic_footer(slide, 8)

    # Top: User Input Layer
    add_academic_card(slide, Inches(0.8), Inches(1.75), Inches(11.733), Inches(0.65), bg_color=COLOR_CARD_TINT, border_color=COLOR_NAVY_PRIMARY)
    tb_in = slide.shapes.add_textbox(Inches(1.0), Inches(1.82), Inches(11.333), Inches(0.5))
    tf_in = tb_in.text_frame
    p_in0 = tf_in.paragraphs[0]
    p_in0.text = "1. CANDIDATE INPUT LAYER"
    p_in0.font.name = FONT_HEADING
    p_in0.font.size = Pt(10)
    p_in0.font.bold = True
    p_in0.font.color.rgb = COLOR_NAVY_PRIMARY
    p_in1 = tf_in.add_paragraph()
    p_in1.text = "Candidate Resume (PDF/Text)  •  Target Job Description (JD)  •  Interview Question Responses  •  Daily Conceptual Drills"
    p_in1.font.name = FONT_BODY
    p_in1.font.size = Pt(9.5)
    p_in1.font.color.rgb = COLOR_TEXT_MUTED

    # Arrow down
    tb_arr1 = slide.shapes.add_textbox(Inches(6.4), Inches(2.4), Inches(0.6), Inches(0.3))
    tb_arr1.text_frame.paragraphs[0].text = "▼"
    tb_arr1.text_frame.paragraphs[0].font.size = Pt(12)
    tb_arr1.text_frame.paragraphs[0].font.color.rgb = COLOR_MAROON_ACCENT

    # Middle: Core Modules Grid (React + Vite Client Processing Layer)
    modules = [
        ("Interview Setup", "Role, Round & Tier"),
        ("Mock Simulator", "Timed Paced Q&A"),
        ("Feedback Report", "5-Metric Evaluation"),
        ("ATS Scanner", "Keyword Gap Audit"),
        ("Skill Gap Analyzer", "SVG Radar Mapping"),
        ("Daily Challenge", "XP & 7-Day Streak"),
        ("Control Dashboard", "Central Cockpit")
    ]
    
    m_w = Inches(1.58)
    m_h = Inches(0.85)
    m_top = Inches(2.7)
    
    for i, (m_title, m_sub) in enumerate(modules):
        m_left = Inches(0.8 + i * 1.69)
        add_academic_card(slide, m_left, m_top, m_w, m_h, bg_color=COLOR_BLUE_SOFT, border_color=COLOR_BLUE_ROYAL)
        tb_m = slide.shapes.add_textbox(m_left + Inches(0.05), m_top + Inches(0.1), m_w - Inches(0.1), Inches(0.65))
        tf_m = tb_m.text_frame
        tf_m.word_wrap = True
        tf_m.margin_left = tf_m.margin_top = tf_m.margin_right = tf_m.margin_bottom = 0
        pm0 = tf_m.paragraphs[0]
        pm0.alignment = PP_ALIGN.CENTER
        pm0.text = m_title
        pm0.font.name = FONT_HEADING
        pm0.font.size = Pt(9.5)
        pm0.font.bold = True
        pm0.font.color.rgb = COLOR_NAVY_PRIMARY
        pm1 = tf_m.add_paragraph()
        pm1.alignment = PP_ALIGN.CENTER
        pm1.text = m_sub
        pm1.font.name = FONT_BODY
        pm1.font.size = Pt(8.5)
        pm1.font.color.rgb = COLOR_TEXT_MUTED

    # Arrow down
    tb_arr2 = slide.shapes.add_textbox(Inches(6.4), Inches(3.55), Inches(0.6), Inches(0.3))
    tb_arr2.text_frame.paragraphs[0].text = "▼"
    tb_arr2.text_frame.paragraphs[0].font.size = Pt(12)
    tb_arr2.text_frame.paragraphs[0].font.color.rgb = COLOR_MAROON_ACCENT

    # Tier 3: Prototype Decision Engine & Heuristics
    add_academic_card(slide, Inches(0.8), Inches(3.85), Inches(11.733), Inches(1.15), bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), Inches(3.95), Inches(3.6), Inches(0.26), "PROTOTYPE DECISION & HEURISTIC ENGINE", bg_color=COLOR_MAROON_ACCENT, font_size=8.5)
    
    tb_eng = slide.shapes.add_textbox(Inches(1.0), Inches(4.25), Inches(11.333), Inches(0.68))
    tf_eng = tb_eng.text_frame
    tf_eng.word_wrap = True
    add_bullet_point(tf_eng, "Rule-Based Evaluation:", "Evaluates answer lengths, keyword coverage, and STAR framing against 5 predefined rubrics.", pt_size=9.5, space_after=2)
    add_bullet_point(tf_eng, "Deficit Isolation:", "Flags competencies scoring <65% as 'Priority' and sequences tailored remedial modules.", pt_size=9.5, space_after=2)
    add_bullet_point(tf_eng, "Adaptive Escalation:", "Dynamically adjusts follow-up difficulty when candidate exhibits mastery (score ≥80%).", pt_size=9.5, space_after=0)

    # Tier 4: Output & State Layer
    card_b_w = Inches(5.72)
    card_b_h = Inches(1.35)
    b_top = Inches(5.15)

    # Left: Client-Side State
    add_academic_card(slide, Inches(0.8), b_top, card_b_w, card_b_h, bg_color=COLOR_CARD_TINT, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(0.95), b_top + Inches(0.12), Inches(3.2), Inches(0.24), "CLIENT-SIDE STATE & PERSISTENCE", bg_color=COLOR_NAVY_PRIMARY, font_size=8.5)
    tb_st = slide.shapes.add_textbox(Inches(0.95), b_top + Inches(0.42), card_b_w - Inches(0.3), Inches(0.85))
    tf_st = tb_st.text_frame
    tf_st.word_wrap = True
    add_bullet_point(tf_st, "LocalStorage Persistence:", "Stores interview history, ATS results, XP, and streak.", pt_size=9.5, space_after=3)
    add_bullet_point(tf_st, "React Context:", "Coordinates cross-page state updates synchronously.", pt_size=9.5, space_after=0)

    # Right: Output Layer
    add_academic_card(slide, Inches(6.813), b_top, card_b_w, card_b_h, bg_color=COLOR_GREEN_TINT, border_color=RGBColor(134, 239, 172))
    add_badge(slide, Inches(6.963), b_top + Inches(0.12), Inches(3.2), Inches(0.24), "DYNAMIC CANDIDATE GUIDANCE", bg_color=COLOR_GREEN_SUCCESS, font_size=8.5)
    tb_out = slide.shapes.add_textbox(Inches(6.963), b_top + Inches(0.42), card_b_w - Inches(0.3), Inches(0.85))
    tf_out = tb_out.text_frame
    tf_out.word_wrap = True
    add_bullet_point(tf_out, "SVG Radar Chart:", "Multi-axis visual mapping of candidate strengths & gaps.", pt_size=9.5, space_after=3)
    add_bullet_point(tf_out, "Actionable Prescription:", "Directs candidate to specific next-step preparation tasks.", pt_size=9.5, space_after=0)

    # Bottom workflow sequence
    tb_flow = slide.shapes.add_textbox(Inches(0.8), Inches(6.6), Inches(11.733), Inches(0.35))
    p_f = tb_flow.text_frame.paragraphs[0]
    p_f.alignment = PP_ALIGN.CENTER
    p_f.text = "Simplified Agent Flow: Resume ➔ ATS Analysis ➔ Skill Gap ➔ Preparation ➔ Mock Interview ➔ Evaluation ➔ Deficit Detection ➔ Recommendation ➔ Daily Practice"
    p_f.font.name = FONT_BODY
    p_f.font.size = Pt(8.5)
    p_f.font.bold = True
    p_f.font.color.rgb = COLOR_NAVY_PRIMARY

# ==============================================================================
# SLIDE 9: AGENT-LIKE DECISION MAKING
# ==============================================================================
def build_slide_9(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Prototype Agent-Like Decision Making", "AGENTIC DECISION LOGIC", "Rule-based heuristics driving autonomous weakness detection & practice prescription")
    add_academic_footer(slide, 9)

    # Left: Core Agent Workflow Loop
    left_w = Inches(4.5)
    add_academic_card(slide, Inches(0.8), Inches(1.75), left_w, Inches(4.99), bg_color=COLOR_CARD_TINT, border_color=COLOR_NAVY_PRIMARY)
    add_badge(slide, Inches(1.0), Inches(1.95), left_w - Inches(0.4), Inches(0.32), "THE CONTINUOUS AGENT COACHING LOOP", bg_color=COLOR_NAVY_PRIMARY, font_size=9)

    steps = [
        ("1. Candidate Assessment", "Perform interview or evaluate uploaded resume."),
        ("2. Multi-Metric Scoring", "Compute scores across 5 predefined rubrics."),
        ("3. Deficit Isolation", "Identify competencies falling below target (<70%)."),
        ("4. Prescriptive Action", "Select highest-yield remediation activity."),
        ("5. Focused Practice", "Candidate completes daily drill or role practice."),
        ("6. Trajectory Tracking", "Record progress and calibrate next milestone.")
    ]

    tb_s = slide.shapes.add_textbox(Inches(1.0), Inches(2.4), left_w - Inches(0.4), Inches(4.2))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    for s_title, s_desc in steps:
        add_bullet_point(tf_s, s_title + ":", s_desc, pt_size=10, space_after=6)

    # Right: Formal Decision Rules
    r_left = Inches(5.5)
    r_w = Inches(7.033)
    
    rules = [
        ("COMMUNICATION DEFICIT RULE", "IF Communication Score < 70% ➔ Recommend STAR Method Framework Drill", "Candidate answers lacked structured Situation-Task-Action-Result format. Agent prescribes behavioral drills to build concise narrative framing.", COLOR_MAROON_ACCENT),
        ("TECHNICAL DEPTH DEFICIT RULE", "IF Technical Knowledge Score < 70% ➔ Recommend Core Domain Conceptual Practice", "Answer exhibited surface-level recall without architectural depth. Agent assigns fundamental conceptual drills (e.g. Model Bias-Variance).", COLOR_NAVY_PRIMARY),
        ("SYSTEM DESIGN DEFICIT RULE", "IF System Design Score < 70% ➔ Recommend Distributed Tradeoff Case Studies", "Candidate neglected scalability, latency, or storage tradeoffs. Agent recommends CAP theorem and microservice partition case studies.", COLOR_MAROON_ACCENT),
        ("ADAPTIVE DIFFICULTY ESCALATION RULE", "IF Response Score ≥ 80% ➔ Escalate Question Tier; ELSE Provide Scaffolded Hint", "When a candidate exhibits mastery, subsequent questions increase in complexity; when struggling, the agent provides structured guidance.", COLOR_GREEN_SUCCESS)
    ]

    for i, (tag, formula, explanation, col) in enumerate(rules):
        c_top = Inches(1.75 + i * 1.25)
        add_academic_card(slide, r_left, c_top, r_w, Inches(1.15), bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, r_left + Inches(0.15), c_top + Inches(0.1), Inches(3.2), Inches(0.24), tag, bg_color=col, font_size=8)
        
        tb = slide.shapes.add_textbox(r_left + Inches(0.15), c_top + Inches(0.38), r_w - Inches(0.3), Inches(0.72))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p_form = tf.paragraphs[0]
        p_form.text = formula
        p_form.font.name = FONT_HEADING
        p_form.font.size = Pt(10)
        p_form.font.bold = True
        p_form.font.color.rgb = COLOR_NAVY_PRIMARY

        p_exp = tf.add_paragraph()
        p_exp.text = explanation
        p_exp.font.name = FONT_BODY
        p_exp.font.size = Pt(9)
        p_exp.font.color.rgb = COLOR_TEXT_MUTED

    # Clarification footer
    tb_ac = slide.shapes.add_textbox(Inches(5.5), Inches(6.75), r_w, Inches(0.3))
    p_ac = tb_ac.text_frame.paragraphs[0]
    p_ac.text = "Academic Clarification: Termed 'Prototype Agent Logic' / 'Rule-Based Agent Decision Making'. Avoids claiming full LLM autonomy."
    p_ac.font.name = FONT_BODY
    p_ac.font.size = Pt(8.5)
    p_ac.font.italic = True
    p_ac.font.color.rgb = COLOR_TEXT_LIGHT

# ==============================================================================
# SLIDE 10: CORE FUNCTIONAL MODULES
# ==============================================================================
def build_slide_10(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Core Functional Modules", "IMPLEMENTED MODULE DETAILS", "Detailed examination of the three primary interactive preparation components")
    add_academic_footer(slide, 10)

    col_w = Inches(3.72)
    card_h = Inches(4.99)
    c_top = Inches(1.75)

    # Module 1: Mock Interview Simulator
    add_academic_card(slide, Inches(0.8), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "1. MOCK INTERVIEW SIMULATOR", bg_color=COLOR_NAVY_PRIMARY, font_size=9)
    
    tb1 = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    add_bullet_point(tf1, "Multi-Domain Setup:", "Supports 6 engineering roles (ML, SDE, Data Science, DevOps, AI, Full Stack) across 4 round categories.", pt_size=10, space_after=8)
    add_bullet_point(tf1, "Pacing Timer & Word Count:", "Active 3:00 countdown timer, real-time word counter, and interviewer advice drawer.", pt_size=10, space_after=8)
    add_bullet_point(tf1, "5-Dimension Rubrics:", "Technical Knowledge, Problem Solving, STAR Communication, Relevance, and Confidence.", pt_size=10, space_after=8)
    add_bullet_point(tf1, "Feedback Report:", "82/100 composite score gauge, detailed strengths/weaknesses, and transparent Agent Decision Timeline.", pt_size=10, space_after=0)

    # Module 2: ATS Resume Scanner
    add_academic_card(slide, Inches(4.806), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(5.006), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "2. ATS RESUME SCANNER", bg_color=COLOR_BLUE_ROYAL, font_size=9)
    
    tb2 = slide.shapes.add_textbox(Inches(5.006), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    add_bullet_point(tf2, "Client-Side Tokenization:", "Extracts candidate skills from uploaded resume and matches against target Job Description text.", pt_size=10, space_after=8)
    add_bullet_point(tf2, "Readiness Metric (84/100):", "Evaluates Keyword Match, Skills Alignment, Formatting Impact, and Experience Depth.", pt_size=10, space_after=8)
    add_bullet_point(tf2, "Keyword Gap Analysis:", "Classifies skills into Matched Keywords (Python, ML, Scikit-learn) vs. Missing Keywords (Docker, SQL, AWS).", pt_size=10, space_after=8)
    add_bullet_point(tf2, "Actionable Advice:", "Prompts candidate to incorporate missing competencies into both resume and subsequent interview practice.", pt_size=10, space_after=0)

    # Module 3: Skill Gap Analyzer
    add_academic_card(slide, Inches(8.813), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(9.013), c_top + Inches(0.2), Inches(3.32), Inches(0.32), "3. SKILL GAP ANALYZER", bg_color=COLOR_MAROON_ACCENT, font_size=9)
    
    tb3 = slide.shapes.add_textbox(Inches(9.013), c_top + Inches(0.65), Inches(3.32), Inches(4.1))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    add_bullet_point(tf3, "SVG Radar Chart:", "Zero-dependency 6-axis polygon mapping candidate baseline vs. current session performance.", pt_size=10, space_after=8)
    add_bullet_point(tf3, "Competency Tiering:", "Classifies 8 competencies into Strong (≥80%), Needs Practice (65–79%), and Priority (<65%).", pt_size=10, space_after=8)
    add_bullet_point(tf3, "Top 3 Bottlenecks:", "Automatically surfaces highest-impact deficits (e.g. System Design, STAR Communication).", pt_size=10, space_after=8)
    add_bullet_point(tf3, "4-Step Learning Path:", "Sequences tailored preparation milestones with immediate 'Recommended Now' priority task.", pt_size=10, space_after=0)

# ==============================================================================
# SLIDE 11: HOW OUR PROJECT OVERCOMES THE LIMITATIONS
# ==============================================================================
def build_slide_11(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "How Our Project Overcomes the Limitations", "COMPARATIVE ANALYSIS", "Direct response matrix showing how the proposed agent resolves existing shortcomings")
    add_academic_footer(slide, 11)

    comparisons = [
        ("Fragmented Preparation Landscape", "Integrated Single-Workflow Architecture", "Consolidates resume ATS scanning, adaptive mock interviews, rubric feedback, and skill gap analysis into a unified React/Vite interface."),
        ("Static Generic Question Banks", "Adaptive Questioning & Role Calibration", "Dynamically adjusts follow-up difficulty to candidate mastery across 6 distinct engineering domains and 4 round types."),
        ("Open-Loop Scores Without Remediation", "Closed-Loop Weakness-to-Drill Pipeline", "Evaluation deficits automatically update the Skill Gap Radar Chart and generate targeted daily conceptual challenges."),
        ("Isolated Clerical Resume Checking", "Resume-to-Interview Competency Linkage", "Missing ATS keywords directly inform interview setup, turning identified resume deficiencies into active practice goals."),
        ("Scattered Practice & Habit Decay", "Gamified Continuity (XP, Streak, Levels)", "Incentivizes continuous daily preparation through +50 XP rewards, 7-day streak counters, and milestone achievement unlocks."),
        ("Passive Prompt-Driven Chatbots", "Proactive Agent Recommendation Engine", "Replaces passive waiting with autonomous coaching that prescribes exact next steps based on historical performance data.")
    ]

    card_w = Inches(5.72)
    card_h = Inches(1.5)
    
    for i, (limitation, solution, desc) in enumerate(comparisons):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 6.013)
        c_top = Inches(1.8 + r * 1.68)

        add_academic_card(slide, c_left, c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        
        # Red Limitation Header
        add_badge(slide, c_left + Inches(0.12), c_top + Inches(0.12), card_w - Inches(0.24), Inches(0.22), f"LIMITATION: {limitation.upper()}", bg_color=COLOR_MAROON_ACCENT, font_size=7.5)
        
        # Green Solution Header
        add_badge(slide, c_left + Inches(0.12), c_top + Inches(0.38), card_w - Inches(0.24), Inches(0.24), f"OUR SOLUTION: {solution.upper()}", bg_color=COLOR_GREEN_SUCCESS, font_size=8)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.66), card_w - Inches(0.3), Inches(0.78))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        p = tf.paragraphs[0]
        p.text = desc
        p.font.name = FONT_BODY
        p.font.size = Pt(9.5)
        p.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 12: TECHNOLOGY STACK & IMPLEMENTATION DETAILS
# ==============================================================================
def build_slide_12(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Technology Stack & Implementation", "SOFTWARE ARCHITECTURE", "Lightweight, zero-cost client-side engineering stack enabling instant evaluation")
    add_academic_footer(slide, 12)

    tech_categories = [
        ("Frontend Architecture", "React 19 (JavaScript ES6+)", [
            ("Component-Based UI:", "Modular functional components with React Hooks (useState, useContext, useMemo)."),
            ("Clean Separation of Concerns:", "Isolated page routing, reusable UI primitives, and domain logic."),
            ("Deterministic Rendering:", "Fast, predictable UI updates across all responsive breakpoints.")
        ], COLOR_NAVY_PRIMARY),
        ("Build Tooling & Bundler", "Vite 8 Build Engine", [
            ("Sub-Second Compilation:", "Production bundle builds in 1.05s with 0 errors or warnings."),
            ("Instant Hot Module Replacement:", "Near-instant dev server startup for rapid feature prototyping."),
            ("Optimized Assets:", "Tree-shaken JavaScript bundles ensuring minimal client memory footprint.")
        ], COLOR_BLUE_ROYAL),
        ("Styling & Visual Design", "Tailwind CSS v4 + Glassmorphism", [
            ("Modern Visual Aesthetic:", "Professional dark/light glassmorphic cards with subtle slate borders."),
            ("Fully Responsive Grid:", "Validated across desktop, tablet, and mobile with zero horizontal overflow."),
            ("Design Token Consistency:", "Strict spacing, typography, and color tokens matching SaaS standards.")
        ], COLOR_MAROON_ACCENT),
        ("Data Visualization & State", "Pure SVG + Browser LocalStorage", [
            ("Zero-Dependency Charts:", "Custom mathematical SVG Radar Chart and Performance Line Chart."),
            ("Persistent Client State:", "LocalStorage saves interview scores, ATS results, XP, and streak."),
            ("Zero External Costs:", "Runs 100% client-side without cloud database or paid API dependencies.")
        ], COLOR_GREEN_SUCCESS)
    ]

    card_w = Inches(5.72)
    card_h = Inches(2.25)
    
    for i, (cat, tech_title, details, col) in enumerate(tech_categories):
        r = i // 2
        c = i % 2
        c_left = Inches(0.8 + c * 6.013)
        c_top = Inches(1.8 + r * 2.45)

        add_academic_card(slide, c_left, c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
        add_badge(slide, c_left + Inches(0.15), c_top + Inches(0.15), card_w - Inches(0.3), Inches(0.28), f"{cat.upper()}  •  {tech_title}", bg_color=col, font_size=9)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.15), c_top + Inches(0.5), card_w - Inches(0.3), Inches(1.65))
        tf = tb.text_frame
        tf.word_wrap = True
        for b_t, b_d in details:
            add_bullet_point(tf, b_t, b_d, pt_size=9.5, space_after=4)

    # Bottom academic statement
    tb_stmt = slide.shapes.add_textbox(Inches(0.8), Inches(6.75), Inches(11.733), Inches(0.3))
    p_stmt = tb_stmt.text_frame.paragraphs[0]
    p_stmt.alignment = PP_ALIGN.CENTER
    p_stmt.text = "Strict Academic Constraint: The prototype deliberately avoids cloud databases, microservices, or paid LLM tokens to guarantee 100% deterministic demo reliability."
    p_stmt.font.name = FONT_BODY
    p_stmt.font.size = Pt(8.5)
    p_stmt.font.italic = True
    p_stmt.font.color.rgb = COLOR_TEXT_LIGHT

# ==============================================================================
# SLIDE 13: IMPLEMENTED FEATURES CHECKLIST
# ==============================================================================
def build_slide_13(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Implemented Features Checklist", "PROTOTYPE VERIFICATION", "Complete inventory of 16 live, fully verified functional prototype capabilities")
    add_academic_footer(slide, 13)

    features = [
        ("01. Landing Page & Roadmap", "Futuristic brand identity, interactive audio waveform visualizer, and 5-step preparation roadmap."),
        ("02. Fast-Track Demo Login", "Simulated demo authentication as 'Alex Rivera' with query parameter return-path routing."),
        ("03. Interview Setup Module", "Configurable engineering roles (6 domains), interview round types (4 types), and difficulty tiers."),
        ("04. Interview Ready Briefing", "Pre-session briefing summary, 5 standardized evaluation rubrics, and Voice Mode Coming Soon notice."),
        ("05. Mock Interview Simulator", "Active 3:00 countdown pacing timer, response word counter, and sample answer autofill for evaluation."),
        ("06. Interview Feedback Report", "82/100 composite readiness gauge, rubric breakdowns, strengths, weaknesses, and question accordion."),
        ("07. Agent Decision Timeline", "Transparent 5-stage chronological decision trace showing how evaluation results trigger practice tasks."),
        ("08. Skill Gap Analyzer", "Zero-dependency SVG 6-axis Radar Chart contrasting candidate baseline against current performance."),
        ("09. Deficit Prioritization", "Categorizes 8 skills into Strong (≥80%), Needs Practice (65–79%), and Priority (<65%) tiers."),
        ("10. 4-Step Learning Roadmap", "Sequenced preparation pathway highlighting the immediate high-yield milestone ('Recommended Now')."),
        ("11. ATS Resume Scanner", "Client-side document parser comparing uploaded candidate skills against target Job Description text."),
        ("12. Matched vs. Missing Keywords", "Honest keyword alignment reporting matched skills vs. missing gaps with honest advisory labeling."),
        ("13. Daily Conceptual Challenges", "Rapid 5-minute technical drills (e.g. Supervised vs. Unsupervised Learning) awarding +50 XP and confetti."),
        ("14. Gamification Engine", "Active 7-day streak counter and level progression formula (L1: 0–499 XP, L2: 500–999 XP, L3: 1000+ XP)."),
        ("15. Central Command Dashboard", "13 integrated sections including KPI cards, AI Coach Banner, practice tasks, and quick actions."),
        ("16. Longitudinal Progress Chart", "SVG performance line chart plotting candidate growth trajectory across 5 evaluation rounds (+14 pts).")
    ]

    col_w = Inches(5.72)
    card_h = Inches(0.55)
    
    for i, (title, desc) in enumerate(features):
        col = i // 8
        row = i % 8
        c_left = Inches(0.8 + col * 6.013)
        c_top = Inches(1.75 + row * 0.63)

        add_academic_card(slide, c_left, c_top, col_w, card_h, bg_color=COLOR_CARD_TINT, border_color=COLOR_BORDER_LIGHT)
        
        # Checkmark badge
        add_badge(slide, c_left + Inches(0.1), c_top + Inches(0.12), Inches(0.32), Inches(0.32), "✓", bg_color=COLOR_GREEN_SUCCESS, font_size=11)
        
        tb = slide.shapes.add_textbox(c_left + Inches(0.5), c_top + Inches(0.06), col_w - Inches(0.6), Inches(0.45))
        tf = tb.text_frame
        tf.word_wrap = True
        tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
        
        p = tf.paragraphs[0]
        r_b = p.add_run()
        r_b.text = title + ": "
        r_b.font.name = FONT_HEADING
        r_b.font.size = Pt(9)
        r_b.font.bold = True
        r_b.font.color.rgb = COLOR_NAVY_PRIMARY

        r_d = p.add_run()
        r_d.text = desc
        r_d.font.name = FONT_BODY
        r_d.font.size = Pt(8.5)
        r_d.font.color.rgb = COLOR_TEXT_MUTED

# ==============================================================================
# SLIDE 14: PROTOTYPE LIMITATIONS & FUTURE SCOPE
# ==============================================================================
def build_slide_14(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Prototype Limitations & Future Scope", "SCOPE BOUNDARIES & ROADMAP", "Transparent academic distinction between current prototype and Phase 2 production")
    add_academic_footer(slide, 14)

    col_w = Inches(5.72)
    card_h = Inches(4.99)
    c_top = Inches(1.75)

    # Left: Current Prototype Limitations
    add_academic_card(slide, Inches(0.8), c_top, col_w, card_h, bg_color=COLOR_AMBER_TINT, border_color=RGBColor(252, 211, 77))
    add_badge(slide, Inches(1.0), c_top + Inches(0.2), col_w - Inches(0.4), Inches(0.32), "CURRENT PROTOTYPE LIMITATIONS (ACADEMIC HALF-PROJECT)", bg_color=COLOR_AMBER_ALERT, font_size=9)
    
    tb_lim = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.65), col_w - Inches(0.4), Inches(4.1))
    tf_lim = tb_lim.text_frame
    tf_lim.word_wrap = True
    add_bullet_point(tf_lim, "Rule-Based Heuristic Evaluation:", "Answer scoring uses deterministic length and keyword rubrics rather than live generative LLM inference.", pt_size=10, space_after=8)
    add_bullet_point(tf_lim, "Simulated Text Pacing:", "Live conversational voice mode is simulated and marked 'Coming Soon' in the interface.", pt_size=10, space_after=8)
    add_bullet_point(tf_lim, "Client-Side Persistence:", "Data is stored in browser localStorage; no multi-tenant remote database or cloud syncing is implemented.", pt_size=10, space_after=8)
    add_bullet_point(tf_lim, "Prototype Keyword ATS:", "ATS resume parser uses token dictionary comparison rather than deep transformer-based semantic parsing.", pt_size=10, space_after=8)
    add_bullet_point(tf_lim, "No Biometric Physical Sensors:", "Speech emotion recognition and webcam gesture posture tracking are not part of the current build.", pt_size=10, space_after=0)

    # Right: Future Scope (Phase 2 Roadmap)
    add_academic_card(slide, Inches(6.813), c_top, col_w, card_h, bg_color=COLOR_BLUE_SOFT, border_color=RGBColor(191, 219, 254))
    add_badge(slide, Inches(7.013), c_top + Inches(0.2), col_w - Inches(0.4), Inches(0.32), "FUTURE SCOPE (PHASE 2 PRODUCTION ROADMAP)", bg_color=COLOR_BLUE_ROYAL, font_size=9)
    
    tb_fut = slide.shapes.add_textbox(Inches(7.013), c_top + Inches(0.65), col_w - Inches(0.4), Inches(4.1))
    tf_fut = tb_fut.text_frame
    tf_fut.word_wrap = True
    add_bullet_point(tf_fut, "Gemini Live API Integration:", "Real-time, bidirectional voice streaming with natural conversational turn-taking and speech interruption.", pt_size=10, space_after=8)
    add_bullet_point(tf_fut, "Multimodal Computer Vision:", "Webcam posture tracking, eye-contact detection, and facial expression sentiment classification.", pt_size=10, space_after=8)
    add_bullet_point(tf_fut, "Vector Semantic ATS Engine:", "Embeddings-based semantic matching using pgvector or Pinecone to evaluate conceptual alignment.", pt_size=10, space_after=8)
    add_bullet_point(tf_fut, "Cloud Backend Architecture:", "FastAPI backend with PostgreSQL, Redis cache, and enterprise JWT role-based authentication.", pt_size=10, space_after=8)
    add_bullet_point(tf_fut, "Placement Cell Analytics:", "Institutional admin portal enabling university faculty to monitor batch-wide interview readiness.", pt_size=10, space_after=0)

# ==============================================================================
# SLIDE 15: CONCLUSION
# ==============================================================================
def build_slide_15(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)
    add_academic_header(slide, "Conclusion", "PROJECT SUMMARY & TAKEAWAYS", "Summary of academic contributions and prototype evaluation findings")
    add_academic_footer(slide, 15)

    # Central Conclusion Quote Card
    add_academic_card(slide, Inches(0.8), Inches(1.75), Inches(11.733), Inches(1.4), bg_color=COLOR_CARD_TINT, border_color=COLOR_NAVY_PRIMARY)
    tb_q = slide.shapes.add_textbox(Inches(1.0), Inches(1.85), Inches(11.333), Inches(1.2))
    tf_q = tb_q.text_frame
    tf_q.word_wrap = True
    p_q = tf_q.paragraphs[0]
    p_q.text = "\"The AI Career Preparation Agent successfully demonstrates a connected, closed-loop approach to interview preparation by uniting resume audit, mock interviews, multi-dimensional feedback, skill-gap analysis, recommendations, daily practice, and progress tracking into a single cohesive workflow.\""
    p_q.font.name = FONT_BODY
    p_q.font.size = Pt(12)
    p_q.font.bold = True
    p_q.font.italic = True
    p_q.font.color.rgb = COLOR_NAVY_PRIMARY

    # 3 Key Takeaway Columns
    col_w = Inches(3.72)
    card_h = Inches(3.35)
    c_top = Inches(3.35)

    # 1. Agent Concept Validation
    add_academic_card(slide, Inches(0.8), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), c_top + Inches(0.18), Inches(3.32), Inches(0.3), "1. AGENT CONCEPT VALIDATED", bg_color=COLOR_NAVY_PRIMARY, font_size=9)
    tb1 = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.58), Inches(3.32), Inches(2.6))
    tf1 = tb1.text_frame
    tf1.word_wrap = True
    add_bullet_point(tf1, "Proactive Coaching:", "Proved that uniting disconnected preparation tasks under an agent workflow eliminates student decision paralysis.", pt_size=10, space_after=8)
    add_bullet_point(tf1, "Closed-Loop Feedback:", "Demonstrated that automated deficit isolation leads directly to high-yield remedial practice.", pt_size=10, space_after=0)

    # 2. Technical Feasibility
    add_academic_card(slide, Inches(4.806), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(5.006), c_top + Inches(0.18), Inches(3.32), Inches(0.3), "2. FEASIBILITY DEMONSTRATED", bg_color=COLOR_MAROON_ACCENT, font_size=9)
    tb2 = slide.shapes.add_textbox(Inches(5.006), c_top + Inches(0.58), Inches(3.32), Inches(2.6))
    tf2 = tb2.text_frame
    tf2.word_wrap = True
    add_bullet_point(tf2, "Zero Cost & Fast Latency:", "Delivered a responsive, high-fidelity experience entirely client-side using React 19, Vite 8, and SVG math.", pt_size=10, space_after=8)
    add_bullet_point(tf2, "Deterministic Reliability:", "Rule-based heuristics guarantee 100% predictable, hallucination-free evaluations during viva exams.", pt_size=10, space_after=0)

    # 3. Foundation for Production
    add_academic_card(slide, Inches(8.813), c_top, col_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(9.013), c_top + Inches(0.18), Inches(3.32), Inches(0.3), "3. EXTENSIBLE ARCHITECTURE", bg_color=COLOR_GREEN_SUCCESS, font_size=9)
    tb3 = slide.shapes.add_textbox(Inches(9.013), c_top + Inches(0.58), Inches(3.32), Inches(2.6))
    tf3 = tb3.text_frame
    tf3.word_wrap = True
    add_bullet_point(tf3, "Modular Component Design:", "Application layout and state contexts are structured to seamlessly plug in real LLM APIs in Phase 2.", pt_size=10, space_after=8)
    add_bullet_point(tf3, "Academic Rigor:", "Delivered a complete, academically honest IDP prototype meeting all university evaluation criteria.", pt_size=10, space_after=0)

# ==============================================================================
# SLIDE 16: THANK YOU & VIVA DEFENSE
# ==============================================================================
def build_slide_16(prs):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_slide_background(slide, COLOR_BG_WHITE)

    # Top University Banner
    add_academic_card(slide, Inches(0.8), Inches(0.6), Inches(11.733), Inches(0.7), bg_color=COLOR_NAVY_PRIMARY, border_color=None, shape_type=MSO_SHAPE.RECTANGLE)
    tb_u = slide.shapes.add_textbox(Inches(1.0), Inches(0.65), Inches(11.333), Inches(0.55))
    tf_u = tb_u.text_frame
    p0 = tf_u.paragraphs[0]
    p0.alignment = PP_ALIGN.CENTER
    p0.text = "VIGNAN'S FOUNDATION FOR SCIENCE, TECHNOLOGY & RESEARCH (DEEMED TO BE UNIVERSITY)"
    p0.font.name = FONT_HEADING
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = COLOR_BG_WHITE
    p1 = tf_u.add_paragraph()
    p1.alignment = PP_ALIGN.CENTER
    p1.text = "DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING  •  IDP VIVA VOCE EVALUATION"
    p1.font.name = FONT_BODY
    p1.font.size = Pt(9.5)
    p1.font.color.rgb = RGBColor(254, 240, 138)

    # Center Thank You Box
    add_academic_card(slide, Inches(0.8), Inches(1.5), Inches(11.733), Inches(2.3), bg_color=COLOR_CARD_TINT, border_color=COLOR_BORDER_SLATE)
    tb_ty = slide.shapes.add_textbox(Inches(1.0), Inches(1.7), Inches(11.333), Inches(1.9))
    tf_ty = tb_ty.text_frame
    tf_ty.word_wrap = True
    
    pty0 = tf_ty.paragraphs[0]
    pty0.alignment = PP_ALIGN.CENTER
    pty0.text = "THANK YOU!"
    pty0.font.name = FONT_HEADING
    pty0.font.size = Pt(36)
    pty0.font.bold = True
    pty0.font.color.rgb = COLOR_NAVY_PRIMARY

    pty1 = tf_ty.add_paragraph()
    pty1.alignment = PP_ALIGN.CENTER
    pty1.text = "QUESTIONS & DISCUSSION / VIVA VOCE DEFENSE"
    pty1.font.name = FONT_HEADING
    pty1.font.size = Pt(14)
    pty1.font.bold = True
    pty1.font.color.rgb = COLOR_MAROON_ACCENT

    pty2 = tf_ty.add_paragraph()
    pty2.alignment = PP_ALIGN.CENTER
    pty2.space_before = Pt(4)
    pty2.text = "AI Career Preparation Agent  •  Academic IDP Functional Prototype"
    pty2.font.name = FONT_BODY
    pty2.font.size = Pt(11)
    pty2.font.color.rgb = COLOR_TEXT_MUTED

    # Bottom Two Information Columns
    card_w = Inches(5.72)
    card_h = Inches(2.3)
    c_top = Inches(4.0)

    # Left: Student Credentials
    add_academic_card(slide, Inches(0.8), c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(1.0), c_top + Inches(0.15), Inches(2.0), Inches(0.28), "PRESENTED BY", bg_color=COLOR_NAVY_PRIMARY, font_size=9)
    tb_s = slide.shapes.add_textbox(Inches(1.0), c_top + Inches(0.48), card_w - Inches(0.4), Inches(1.7))
    tf_s = tb_s.text_frame
    tf_s.word_wrap = True
    add_bullet_point(tf_s, "Student:", "Chandolu Praneeth Kumar", pt_size=11, space_after=4)
    add_bullet_point(tf_s, "Regd. Number:", "241FA18483", pt_size=11, space_after=4)
    add_bullet_point(tf_s, "Department:", "Artificial Intelligence & Machine Learning", pt_size=10, space_after=4)
    add_bullet_point(tf_s, "Course / Term:", "MLOPS  •  3rd Year – I Semester", pt_size=10, space_after=4)
    add_bullet_point(tf_s, "Batch:", "[Batch]", pt_size=10, space_after=0)

    # Right: Institutional / Guidance Credentials
    add_academic_card(slide, Inches(6.813), c_top, card_w, card_h, bg_color=COLOR_BG_WHITE, border_color=COLOR_BORDER_SLATE)
    add_badge(slide, Inches(7.013), c_top + Inches(0.15), Inches(2.4), Inches(0.28), "PROJECT GUIDANCE", bg_color=COLOR_MAROON_ACCENT, font_size=9)
    tb_g = slide.shapes.add_textbox(Inches(7.013), c_top + Inches(0.48), card_w - Inches(0.4), Inches(1.7))
    tf_g = tb_g.text_frame
    tf_g.word_wrap = True
    add_bullet_point(tf_g, "Faculty Guide:", "[Guide Name]", pt_size=11, space_after=4)
    add_bullet_point(tf_g, "Designation:", "[Guide Designation / Department]", pt_size=10.5, space_after=4)
    add_bullet_point(tf_g, "Department:", "Artificial Intelligence & Machine Learning", pt_size=10, space_after=4)
    add_bullet_point(tf_g, "College:", "Vignan University, Vadlamudi, Guntur", pt_size=10, space_after=4)
    add_bullet_point(tf_g, "Project Type:", "Industry Defined Project (IDP)", pt_size=10, space_after=0)

    # Bottom Copyright / Date line
    tb_bot = slide.shapes.add_textbox(Inches(0.8), Inches(6.5), Inches(11.733), Inches(0.35))
    p_b = tb_bot.text_frame.paragraphs[0]
    p_b.alignment = PP_ALIGN.CENTER
    p_b.text = "Department of Artificial Intelligence & Machine Learning  •  Vignan University, Vadlamudi, Guntur – 522213"
    p_b.font.name = FONT_BODY
    p_b.font.size = Pt(9)
    p_b.font.color.rgb = COLOR_TEXT_LIGHT

# ==============================================================================
# MAIN GENERATOR PIPELINE
# ==============================================================================
def main():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    print("Generating Slide 1: Title (Industry Defined Project)...")
    build_slide_1(prs)
    print("Generating Slide 2: Agenda...")
    build_slide_2(prs)
    print("Generating Slide 3: Introduction & Background...")
    build_slide_3(prs)
    print("Generating Slide 4: Problem Statement...")
    build_slide_4(prs)
    print("Generating Slide 5: Project Objectives...")
    build_slide_5(prs)
    print("Generating Slide 6: Literature Review & Existing Systems...")
    build_slide_6(prs)
    print("Generating Slide 7: Limitations of Existing Systems...")
    build_slide_7(prs)
    print("Generating Slide 8: Proposed System Architecture (Block Diagram)...")
    build_slide_8(prs)
    print("Generating Slide 9: Prototype Agent-Like Decision Making...")
    build_slide_9(prs)
    print("Generating Slide 10: Core Functional Modules...")
    build_slide_10(prs)
    print("Generating Slide 11: How Our Project Overcomes Limitations...")
    build_slide_11(prs)
    print("Generating Slide 12: Technology Stack & Implementation...")
    build_slide_12(prs)
    print("Generating Slide 13: Implemented Features Checklist...")
    build_slide_13(prs)
    print("Generating Slide 14: Prototype Limitations & Future Scope...")
    build_slide_14(prs)
    print("Generating Slide 15: Conclusion...")
    build_slide_15(prs)
    print("Generating Slide 16: Thank You & Viva Defense...")
    build_slide_16(prs)

    output_filename = "AI_Career_Preparation_Agent_Vignan_IDP_Presentation.pptx"
    prs.save(output_filename)
    
    # Save into dedicated presentation/ folder
    presentation_dir = "presentation"
    os.makedirs(presentation_dir, exist_ok=True)
    target_path = os.path.join(presentation_dir, output_filename)
    shutil.copyfile(output_filename, target_path)

    # Also save into presentation_assets/ as backup
    assets_dir = "presentation_assets"
    os.makedirs(assets_dir, exist_ok=True)
    assets_path = os.path.join(assets_dir, output_filename)
    shutil.copyfile(output_filename, assets_path)

    print(f"\n[SUCCESS] Academic Vignan IDP Presentation saved to:")
    print(f"  - {output_filename}")
    print(f"  - {target_path}")
    print(f"  - {assets_path}")

if __name__ == "__main__":
    main()
