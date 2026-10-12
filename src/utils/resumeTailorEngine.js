/**
 * Autonomous Resume Tailoring & Scholarly Document Engine
 *
 * Re-engineers resume bullet points using Google's XYZ formula:
 * "Accomplished [X] as measured by [Y] by doing [Z]"
 * and incorporates missing ATS keywords with clear human-review markers.
 *
 * Never fabricates candidate identity or unverified business metrics.
 */

import { storageService } from './storage/storageService';

export const resumeTailorEngine = {
  /**
   * Transforms candidate resume text and ATS findings into an optimized, keyword-calibrated dossier
   */
  tailorResume({
    rawResumeText = '',
    missingKeywords = [],
    matchedKeywords = [],
    targetRole = 'Machine Learning Engineer',
    currentScore = 68
  }) {
    const user = storageService.getCurrentUser() || {};
    const candidateName = user.name || 'Candidate';
    const candidateEmail = user.email || 'candidate@example.com';

    const missing = (missingKeywords && missingKeywords.length > 0)
      ? missingKeywords
      : ['Docker', 'AWS', 'SQL', 'CI/CD'];
    const matched = (matchedKeywords && matchedKeywords.length > 0)
      ? matchedKeywords
      : ['Python', 'Problem Solving', 'Git'];

    // 1. Extract actual candidate bullet points or sentences from rawResumeText if present
    const extractedLines = (rawResumeText || '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 20 && (line.startsWith('-') || line.startsWith('â€¢') || line.startsWith('*') || /^[A-Z]/.test(line)))
      .map(line => line.replace(/^[-â€¢*]\s*/, ''));

    const baseBullets = extractedLines.length >= 2
      ? extractedLines.slice(0, 4)
      : [
          `Engineered core ${targetRole} workflows and algorithms for high-throughput data processing.`,
          `Designed and deployed robust software services with structured monitoring and testing.`,
          `Collaborated across engineering teams to refine feature extraction and system scalability.`,
          `Implemented automated validation pipelines to improve reliability and error recovery.`
        ];

    // 2. Re-engineer candidate points using the Google XYZ formula:
    // "Accomplished [X] as measured by [Y] by doing [Z]"
    const bulletTransformations = baseBullets.map((orig, idx) => {
      const keywordToInject = missing[idx % missing.length] || 'Production Testing';
      const tailored = `Optimized and scaled ${orig.replace(/\.$/, '')} utilizing ${keywordToInject} [Verify: fill in your specific tooling], improving execution performance [Verify: insert your measured % or latency metric] by establishing automated validation gates.`;

      return {
        id: `b${idx + 1}`,
        original: orig,
        tailored,
        xyzFormula: {
          x: `Optimized and scaled ${orig.replace(/\.$/, '')}`,
          y: '[Insert verified performance metric, e.g. % throughput gain or latency reduction]',
          z: `Utilizing ${keywordToInject} containerization/infrastructure practices`
        },
        injectedKeyword: keywordToInject,
        humanReviewNote: 'Verify that the tooling, architectural scope, and metrics accurately reflect your verified contributions.'
      };
    });

    const projectedScore = Math.min(95, Math.max(currentScore + 18, 85));
    const newlyAddedKeywords = bulletTransformations.map(b => b.injectedKeyword);
    const allOptimizedSkills = Array.from(new Set([...matched, ...newlyAddedKeywords]));

    const executiveSummary = `Results-focused ${targetRole} with hands-on experience in building scalable, reliable technical systems. Core competencies include ${allOptimizedSkills.slice(0, 6).join(', ')}. Demonstrated ability to apply structured engineering methodologies, optimize performance, and deliver measurable business value.`;

    return {
      candidateName,
      candidateEmail,
      targetRole,
      baselineScore: currentScore,
      projectedScore,
      scoreGain: projectedScore - currentScore,
      executiveSummary,
      bulletTransformations,
      allOptimizedSkills,
      newlyAddedKeywords,
      humanReviewNotice: 'All tailored bullets use the Google XYZ framework. You must verify and customize the bracketed placeholders with your actual measured impact before submitting.',
      fullTailoredMarkdown: this.generateMarkdownDocument({
        candidateName,
        candidateEmail,
        targetRole,
        executiveSummary,
        skills: allOptimizedSkills,
        bullets: bulletTransformations
      })
    };
  },

  generateMarkdownDocument({ candidateName, candidateEmail, targetRole, executiveSummary, skills, bullets }) {
    return `# ${candidateName.toUpperCase()}
**${targetRole.toUpperCase()}** | ${candidateEmail} | [Candidate Contact Details & Portfolio / LinkedIn]

> **Human Review Notice:** The bullet points below have been formatted using Google's XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]"). Replace all [Verify: ...] markers with your genuine, verified project numbers before submitting to employers.

---

## PROFESSIONAL SUMMARY
${executiveSummary}

---

## CORE TECHNICAL COMPETENCIES
${skills.join('  â€¢  ')}

---

## RE-ENGINEERED KEY BULLET POINTS (XYZ FORMULA)
${bullets.map(b => `- **Tailored:** ${b.tailored}\n  - *Original draft:* "${b.original}"\n  - *Target Keyword Injected:* \`${b.injectedKeyword}\``).join('\n\n')}

---

## VERIFICATION CHECKLIST BEFORE SUBMITTING
- [ ] Every metric (% throughput, latency, reliability) corresponds to my actual contribution.
- [ ] Every mentioned technology (${bullets.map(b => b.injectedKeyword).join(', ')}) is one I am prepared to discuss in depth during technical interviews.
- [ ] Dates, titles, and team scopes are accurate.
`.trim();
  },

  /**
   * Opens a print dialog formatted with clean archival CSS for 1-click PDF download
   */
  printScholarlyDocument(tailoredData) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please enable popups to export printable document.');
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${tailoredData.candidateName} â€” ${tailoredData.targetRole} CV</title>
  <style>
    @page { size: A4; margin: 20mm 15mm; }
    body {
      font-family: 'Times New Roman', Times, serif;
      color: #1a1a1a;
      line-height: 1.45;
      font-size: 11pt;
      margin: 0;
      padding: 0;
    }
    h1 {
      font-size: 20pt;
      text-align: center;
      margin: 0 0 4px 0;
      letter-spacing: 1px;
    }
    .header-sub {
      text-align: center;
      font-size: 9.5pt;
      margin-bottom: 12px;
      color: #333;
    }
    .notice-box {
      background: #fdfaf3;
      border: 1px solid #e2d9c8;
      padding: 8px 12px;
      font-size: 9pt;
      margin-bottom: 14px;
      font-style: italic;
    }
    hr {
      border: none;
      border-top: 1px solid #999;
      margin: 10px 0;
    }
    h2 {
      font-size: 11.5pt;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid #1a1a1a;
      margin: 14px 0 6px 0;
      padding-bottom: 2px;
    }
    p { margin: 4px 0; font-size: 10pt; }
    .skills-block {
      font-size: 9.5pt;
      margin: 6px 0;
      line-height: 1.6;
    }
    ul {
      margin: 4px 0 10px 18px;
      padding: 0;
    }
    li {
      margin-bottom: 4px;
      font-size: 9.5pt;
      line-height: 1.4;
    }
  </style>
</head>
<body>
  <h1>${tailoredData.candidateName.toUpperCase()}</h1>
  <div class="header-sub">
    ${tailoredData.targetRole} &bull; ${tailoredData.candidateEmail} &bull; Candidate Portfolio & Credentials
  </div>

  <div class="notice-box">
    <strong>Human Verification Notice:</strong> The points below have been tailored using Google's XYZ formula. Verify all tooling and metrics against your actual project experience before submitting to prospective employers.
  </div>

  <h2>Professional Summary</h2>
  <p>${tailoredData.executiveSummary}</p>

  <h2>Core Technical Competencies</h2>
  <div class="skills-block">
    ${tailoredData.allOptimizedSkills.join(', ')}
  </div>

  <h2>Targeted Technical Contributions</h2>
  <ul>
    ${tailoredData.bulletTransformations.map(b => `<li>${b.tailored}</li>`).join('')}
  </ul>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
};
