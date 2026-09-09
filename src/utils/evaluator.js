/**
 * Prototype Evaluation Engine & Adaptive Logic
 * 
 * ARCHITECTURE NOTE FOR LLM UPGRADE:
 * In a production phase, this module's `evaluateAnswer` function will call the Gemini API
 * (e.g., gemini-2.5-flash) with structured JSON output schema (schema: { scores: {...}, feedback: {...} }).
 * For this functional prototype, it uses realistic heuristic analysis of length, keyword overlap,
 * structure indicators, and sentiment markers.
 */

export function evaluateAnswer(questionObj, answerText, role = 'Machine Learning Engineer', interviewType = 'Technical', _difficulty = 'Intermediate') {
  const text = (answerText || '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 5) {
    return {
      scores: {
        technicalKnowledge: 4.0,
        relevance: 3.5,
        clarity: 4.0,
        structure: 3.0,
        confidence: 3.5,
        overall: 3.6
      },
      strengths: [
        'Attempted to address the question prompt.'
      ],
      areasToImprove: [
        'Response is extremely brief. An interview response typically needs 60-150 words.',
        'No technical explanation, architectural rationale, or examples were provided.'
      ],
      aiRecommendation: 'Expand your answer by stating the definition, explaining how it works with an example, and mentioning any production tradeoffs.',
      adaptiveNote: 'Answer was too brief. The agent will test foundational understanding before advancing difficulty.',
      isAdaptiveFollowUpSuggested: true,
      followUpQuestion: questionObj.followUp || 'Could you elaborate on the practical real-world application of this concept?'
    };
  }

  // Calculate keyword matches
  const lower = text.toLowerCase();
  const idealKeywords = questionObj.idealKeywords || ['design', 'performance', 'data', 'architecture', 'scalability'];
  let keywordHits = 0;
  idealKeywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) keywordHits++;
  });
  const keywordRatio = Math.min(1, keywordHits / Math.max(1, idealKeywords.length));

  // Determine structural and clarity bonuses
  const hasExample = lower.includes('for example') || lower.includes('such as') || lower.includes('in my experience') || lower.includes('in a project') || lower.includes('instance');
  const hasStarStructure = lower.includes('situation') || lower.includes('result') || lower.includes('outcome') || lower.includes('task') || lower.includes('action') || lower.includes('led to');
  const hasMetrics = /\d+[%|x|ms|s|k|m]/.test(lower) || lower.includes('percent') || lower.includes('reduced') || lower.includes('improved');

  // Baseline scores based on length & depth
  let lengthFactor = Math.min(1, wordCount / 90); // 90 words is a good sweet spot for interview mock
  
  let techScore = Math.min(9.8, 5.0 + (keywordRatio * 3.5) + (hasExample ? 0.8 : 0) + (lengthFactor * 0.7));
  let relScore = Math.min(9.6, 5.5 + (keywordRatio * 3.0) + (wordCount > 25 ? 1.0 : 0));
  let clarityScore = Math.min(9.5, 6.0 + (hasExample ? 1.5 : 0.5) + (wordCount >= 40 && wordCount <= 220 ? 1.5 : 0.5));
  let structScore = Math.min(9.4, 5.0 + (hasStarStructure ? 2.5 : 1.0) + (hasExample ? 1.0 : 0.5));
  let confScore = Math.min(9.5, 5.8 + (hasMetrics ? 1.8 : 0.6) + (wordCount > 50 ? 1.2 : 0.5));

  // Round to 1 decimal place
  techScore = Number(techScore.toFixed(1));
  relScore = Number(relScore.toFixed(1));
  clarityScore = Number(clarityScore.toFixed(1));
  structScore = Number(structScore.toFixed(1));
  confScore = Number(confScore.toFixed(1));
  
  const overall = Number(((techScore * 0.3) + (relScore * 0.2) + (clarityScore * 0.2) + (structScore * 0.15) + (confScore * 0.15)).toFixed(1));

  // Dynamic feedback synthesis
  const strengths = [];
  const areasToImprove = [];

  if (keywordRatio >= 0.4) {
    strengths.push('Demonstrated strong command of domain terminology (' + idealKeywords.slice(0, 3).join(', ') + ').');
  } else {
    strengths.push('Good conceptual baseline and relevant topic framing.');
  }

  if (hasExample) {
    strengths.push('Effectively contextualized the explanation with a concrete example or practical analogy.');
  } else {
    areasToImprove.push('Anchor theoretical concepts with a concrete production example or past project experience.');
  }

  if (hasMetrics) {
    strengths.push('Quantified outcomes and impact metrics, which strongly impresses interview panels.');
  } else {
    areasToImprove.push('Include measurable engineering metrics (e.g. latency, accuracy gains, memory reduction, cost savings).');
  }

  if (!hasStarStructure && (interviewType === 'Behavioral' || interviewType === 'HR')) {
    areasToImprove.push('Structure your narrative using the STAR framework (Situation, Task, Action, Result) for higher impact.');
  }

  if (wordCount < 40) {
    areasToImprove.push('Answer could be more thorough; explain the underlying "why" and trade-offs.');
  }

  let aiRecommendation = '';
  let adaptiveNote = '';
  let isAdaptiveFollowUpSuggested = false;

  if (overall >= 8.2) {
    aiRecommendation = 'Outstanding response! Your technical explanation is nuanced and crisp. To stand out even more for senior roles, address edge cases and distributed failure modes.';
    adaptiveNote = 'High performance detected (Score ≥ 8.0). The AI Agent is escalating depth for the next challenge.';
    isAdaptiveFollowUpSuggested = true;
  } else if (overall >= 6.5) {
    aiRecommendation = 'Solid answer that covers the core principle. Boost your score by sharpening the answer structure and highlighting real-world trade-offs.';
    adaptiveNote = 'Balanced performance. Maintaining consistent target pacing.';
    isAdaptiveFollowUpSuggested = false;
  } else {
    aiRecommendation = 'Your conceptual foundation is emerging, but requires deeper precision. Practice defining the mechanism before giving opinions.';
    adaptiveNote = 'Targeted reinforcement: The agent suggests drilling into this sub-topic before continuing.';
    isAdaptiveFollowUpSuggested = true;
  }

  return {
    scores: {
      technicalKnowledge: techScore,
      relevance: relScore,
      clarity: clarityScore,
      structure: structScore,
      confidence: confScore,
      overall
    },
    strengths,
    areasToImprove: areasToImprove.length ? areasToImprove : ['Consider elaborating on secondary architectural trade-offs.'],
    aiRecommendation,
    adaptiveNote,
    isAdaptiveFollowUpSuggested,
    followUpQuestion: questionObj.followUp || 'Can you walk through an edge case where this approach fails?'
  };
}
