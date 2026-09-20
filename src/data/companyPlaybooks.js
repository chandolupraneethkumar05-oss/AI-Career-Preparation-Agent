/**
 * Company Playbooks & Evaluation Rubrics
 * 
 * Provides structured competency matrices and evaluation criteria
 * for major employer interview standards.
 */

export const COMPANY_PLAYBOOKS = [
  {
    id: 'general',
    name: 'General Academic & Industry Standard',
    shortName: 'General Standard',
    badge: 'Standard',
    badgeVariant: 'neutral',
    tagline: 'Comprehensive technical and behavioral rigor',
    description: 'Balanced evaluation across foundational computer science, architectural reasoning, and professional articulation.',
    competencies: [
      { id: 'foundations', name: 'Technical Foundations', criteria: 'Mastery of core algorithms, data structures, and clean coding paradigms.' },
      { id: 'problem_solving', name: 'Analytical Problem Solving', criteria: 'Methodical decomposition of ambiguous challenges into structured solutions.' },
      { id: 'communication', name: 'Articulate Communication', criteria: 'Concise explanation of complex trade-offs using structured frameworks.' },
      { id: 'delivery', name: 'Execution & Reliability', criteria: 'Pragmatic decision-making focused on shipping reliable software.' }
    ]
  },
  {
    id: 'amazon',
    name: 'Amazon Bar Raiser Protocol',
    shortName: 'Amazon Bar Raiser',
    badge: 'Leadership Principles',
    badgeVariant: 'bronze',
    tagline: 'Relentless probing on the 16 Leadership Principles',
    description: 'Evaluates candidate decisions against Amazon Leadership Principles. Probes deeply into individual ownership, customer impact, and measured metrics.',
    competencies: [
      { id: 'customer_obsession', name: 'Customer Obsession', criteria: 'Starts with the customer and works backward; vigorously advocates for user trust.' },
      { id: 'ownership', name: 'Extreme Ownership', criteria: 'Acts on behalf of the entire enterprise; never says "that is not my job".' },
      { id: 'invent_simplify', name: 'Invent & Simplify', criteria: 'Requires innovation and always finds ways to simplify complex systems.' },
      { id: 'bias_for_action', name: 'Bias for Action', criteria: 'Values calculated risk-taking; speed matters in decision making.' },
      { id: 'dive_deep', name: 'Dive Deep & Deliver Results', criteria: 'Operates at all levels, stays connected to details, and delivers on commitments.' }
    ]
  },
  {
    id: 'google',
    name: 'Google GCA & Scale Framework',
    shortName: 'Google GCA',
    badge: 'GCA & Scale',
    badgeVariant: 'navy',
    tagline: 'General Cognitive Ability and massive distributed scale',
    description: 'Assesses candidate aptitude in navigating extreme scale, high ambiguity, algorithmic optimality, and intellectual humility (Googleyness).',
    competencies: [
      { id: 'gca', name: 'General Cognitive Ability (GCA)', criteria: 'Rapidly synthesizes novel constraints; generates creative, first-principles solutions.' },
      { id: 'distributed_scale', name: 'Distributed Systems Scale', criteria: 'Designs for multi-region resilience, fault tolerance, and minimal latency.' },
      { id: 'complexity_optimality', name: 'Algorithmic Optimality', criteria: 'Identifies theoretical lower bounds, optimal Big-O trade-offs, and edge bottlenecks.' },
      { id: 'googleyness', name: 'Googleyness & Humility', criteria: 'Thrives in ambiguity, welcomes constructive feedback, and collaborates without ego.' }
    ]
  },
  {
    id: 'meta',
    name: 'Meta Engineering Velocity & Architecture',
    shortName: 'Meta Velocity',
    badge: 'High Velocity',
    badgeVariant: 'emerald',
    tagline: 'Rapid prototyping, direct impact, and modular architecture',
    description: 'Examines pragmatic execution speed, end-to-end architectural simplicity, and metric-driven measurable business impact.',
    competencies: [
      { id: 'velocity', name: 'Implementation Velocity', criteria: 'Transforms abstract requirements into high-performance working solutions quickly.' },
      { id: 'modular_architecture', name: 'Modular Architecture', criteria: 'Constructs decoupling layers, reusable primitives, and maintainable schemas.' },
      { id: 'impact_focus', name: 'Measurable Business Impact', criteria: 'Directly ties technical decisions to concrete business metrics and user adoption.' },
      { id: 'pragmatism', name: 'Pragmatic Trade-offs', criteria: 'Avoids over-engineering; chooses right-sized tools for immediate scale requirements.' }
    ]
  },
  {
    id: 'mckinsey',
    name: 'McKinsey & Case Strategy Discipline',
    shortName: 'McKinsey Case',
    badge: 'Case Strategy',
    badgeVariant: 'rust',
    tagline: 'MECE hypothesis structuring and executive synthesis',
    description: 'Rigorous management and strategic consulting framework. Demands Mutually Exclusive, Collectively Exhaustive (MECE) problem breakdowns.',
    competencies: [
      { id: 'mece_structuring', name: 'MECE Problem Structuring', criteria: 'Breaks complex business problems into exhaustive, non-overlapping decision trees.' },
      { id: 'market_sizing', name: 'Quantitative Estimation & Sizing', criteria: 'Constructs disciplined back-of-the-envelope models with sound assumptions.' },
      { id: 'hypothesis_driven', name: 'Hypothesis-Driven Synthesis', criteria: 'Forms early testable hypotheses and validates them against commercial data.' },
      { id: 'executive_delivery', name: 'Executive Presentation', criteria: 'Delivers top-down, pyramid-principle summaries suited for C-suite decision makers.' }
    ]
  }
];

export function getCompanyPlaybook(id) {
  return COMPANY_PLAYBOOKS.find((p) => p.id === id) || COMPANY_PLAYBOOKS[0];
}

/**
 * Initializes a live evaluation matrix for a given playbook
 */
export function initializeRubricMatrix(playbookId) {
  const playbook = getCompanyPlaybook(playbookId);
  const matrix = {};
  playbook.competencies.forEach((comp) => {
    matrix[comp.id] = {
      ...comp,
      status: 'pending', // 'pending' | 'verified' | 'weak'
      evidence: [],
      score: 0
    };
  });
  return matrix;
}