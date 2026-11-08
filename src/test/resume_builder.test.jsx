import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import ClassicAcademicTemplate from '../components/resume-builder/templates/ClassicAcademicTemplate';
import ModernProfessionalTemplate from '../components/resume-builder/templates/ModernProfessionalTemplate';
import ExecutiveMinimalTemplate from '../components/resume-builder/templates/ExecutiveMinimalTemplate';
import TemplateSelector from '../components/resume-builder/TemplateSelector';
import ResumeFormEditor from '../components/resume-builder/ResumeFormEditor';
import AnalyzeResumeModal from '../components/resume-builder/AnalyzeResumeModal';
import ResumePreview from '../components/resume-builder/ResumePreview';

// Mock resumeBuilderApi & resumeApi
vi.mock('../services/resumeBuilderApi', () => ({
  resumeBuilderApi: {
    compileText: vi.fn().mockResolvedValue({
      plain_text: 'ALICE CHEN\nSoftware Engineer\nalice@example.com\n\nTECHNICAL SKILLS\nLanguages: Python, Go',
      text: 'ALICE CHEN\nSoftware Engineer\nalice@example.com\n\nTECHNICAL SKILLS\nLanguages: Python, Go',
    }),
  },
}));

vi.mock('../services/resumeApi', () => ({
  resumeApi: {
    analyzeResume: vi.fn().mockResolvedValue({
      overall_score: 88,
      score: 88,
      score_summary: 'Strong technical profile with quantified project impact.',
      target_role: 'Full Stack Engineer',
      matched_skills: ['Python', 'Go'],
    }),
  },
}));

describe('Resume Builder - Template Rendering & Zero Fabrication', () => {
  const sampleContent = {
    personal_info: {
      full_name: 'Alice Chen',
      target_role: 'Software Engineer',
      email: 'alice@example.com',
      phone: '+1 555-0199',
    },
    professional_summary: 'Passionate engineer building distributed systems.',
    education: [
      {
        id: 'edu_1',
        institution: 'UC Berkeley',
        degree: 'B.S.',
        field_of_study: 'EECS',
        start_date: '2019',
        end_date: '2023',
      },
    ],
    skills: [
      {
        id: 'sk_1',
        category: 'Languages',
        skills: ['Python', 'Go', 'TypeScript'],
      },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'Microservices Framework',
        tech_stack: ['Go', 'gRPC'],
        bullet_points: ['Reduced inter-service latency by 35%'],
      },
    ],
    work_experience: [],
    internships: [],
    certifications: [],
    achievements: [],
    custom_sections: [],
  };

  it('renders ClassicAcademicTemplate with serif font and provided data', () => {
    const { container } = render(
      <ClassicAcademicTemplate content={sampleContent} accentColor="#245A45" />
    );

    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText(/UC Berkeley/i)).toBeInTheDocument();
    expect(screen.getByText(/Microservices Framework/i)).toBeInTheDocument();
    expect(screen.getByText(/Reduced inter-service latency/i)).toBeInTheDocument();

    // Verifies Zero Fabrication: empty sections must NOT be rendered
    expect(screen.queryByText(/Professional Experience/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Certifications/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Honors & Achievements/i)).not.toBeInTheDocument();

    // Checks font-serif applied
    expect(container.firstChild.className).toContain('font-serif');
  });

  it('renders ModernProfessionalTemplate with sans font and modern tags', () => {
    const { container } = render(
      <ModernProfessionalTemplate content={sampleContent} accentColor="#245A45" />
    );

    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('UC Berkeley')).toBeInTheDocument();
    expect(screen.getByText('Microservices Framework')).toBeInTheDocument();

    // Zero Fabrication verification
    expect(screen.queryByText('Certifications')).not.toBeInTheDocument();
    expect(container.firstChild.className).toContain('font-sans');
  });

  it('renders ExecutiveMinimalTemplate with high contrast and minimalist structure', () => {
    render(<ExecutiveMinimalTemplate content={sampleContent} accentColor="#334155" />);

    expect(screen.getByText('Alice Chen')).toBeInTheDocument();
    expect(screen.getByText('UC Berkeley')).toBeInTheDocument();
    expect(screen.getByText('Microservices Framework')).toBeInTheDocument();
    expect(screen.queryByText('Certifications')).not.toBeInTheDocument();
  });
});

describe('Resume Builder - TemplateSelector Component', () => {
  it('renders all three template options and triggers callback on change', () => {
    const handleSelectTemplate = vi.fn();
    const handleSelectColor = vi.fn();

    render(
      <TemplateSelector
        templateId="modern_professional"
        accentColor="#245A45"
        onSelectTemplate={handleSelectTemplate}
        onSelectAccentColor={handleSelectColor}
      />
    );

    expect(screen.getByText('Modern Professional')).toBeInTheDocument();
    expect(screen.getByText('Classic Academic')).toBeInTheDocument();
    expect(screen.getByText('Executive Minimal')).toBeInTheDocument();

    // Click Classic Academic
    fireEvent.click(screen.getByText('Classic Academic'));
    expect(handleSelectTemplate).toHaveBeenCalledWith('classic_academic');

    // Click Charcoal Color Swatch
    const slateBtn = screen.getByTitle('Slate Blue');
    fireEvent.click(slateBtn);
    expect(handleSelectColor).toHaveBeenCalledWith('#334155');
  });
});

describe('Resume Builder - ResumeFormEditor Component', () => {
  it('allows navigation across sections and editing personal info', () => {
    const handleChange = vi.fn();
    const content = {
      personal_info: { full_name: 'Bob Builder' },
      professional_summary: '',
      education: [],
      skills: [],
      projects: [],
      work_experience: [],
    };

    render(<ResumeFormEditor content={content} onChange={handleChange} />);

    // Check personal info fields
    const nameInput = screen.getByDisplayValue('Bob Builder');
    fireEvent.change(nameInput, { target: { value: 'Robert Builder' } });

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        personal_info: expect.objectContaining({ full_name: 'Robert Builder' }),
      })
    );

    // Switch to Education tab
    const eduTab = screen.getByRole('button', { name: /Education/i });
    fireEvent.click(eduTab);
    expect(screen.getByRole('button', { name: /Add Education/i })).toBeInTheDocument();
  });

  it('preserves spaces and commas while typing in comma-separated skills input', () => {
    const handleChange = vi.fn();
    const content = {
      personal_info: { full_name: 'Bob' },
      skills: [{ id: 'sk_1', category: 'Languages', skills: ['Python'] }],
    };

    render(<ResumeFormEditor content={content} onChange={handleChange} />);

    // Switch to Skills tab
    const skillsTab = screen.getByRole('button', { name: /Skills/i });
    fireEvent.click(skillsTab);

    // Locate skills input
    const skillsInput = screen.getByPlaceholderText(/e\.g\. Python, TypeScript, React/i);
    expect(skillsInput).toBeInTheDocument();
    expect(skillsInput.value).toBe('Python');

    // Simulate typing comma and space after Python
    fireEvent.change(skillsInput, { target: { value: 'Python, ' } });
    expect(skillsInput.value).toBe('Python, ');

    // Simulate typing React
    fireEvent.change(skillsInput, { target: { value: 'Python, React' } });
    expect(skillsInput.value).toBe('Python, React');

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        skills: [expect.objectContaining({ skills: ['Python', 'React'] })],
      })
    );
  });
});

describe('Resume Builder - AnalyzeResumeModal Component', () => {
  it('initiates ATS analysis and displays the resulting score', async () => {
    const handleClose = vi.fn();
    const content = {
      personal_info: { full_name: 'Alice', target_role: 'Full Stack Engineer' },
      skills: [{ id: '1', category: 'Tech', skills: ['Python', 'Go'] }],
    };

    render(
      <MemoryRouter>
        <AnalyzeResumeModal
          isOpen={true}
          onClose={handleClose}
          content={content}
          targetRole="Full Stack Engineer"
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Analyze Resume with ATS/i)).toBeInTheDocument();

    const analyzeBtn = screen.getByRole('button', { name: /Run ATS Analysis/i });
    fireEvent.click(analyzeBtn);

    // Wait for analysis result to appear
    await waitFor(() => {
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    expect(screen.getByText(/View Full Report in ATS Scanner/i)).toBeInTheDocument();
  });
});

describe('Resume Builder - Multi-Page Rendering & PDF Print Styles', () => {
  const shortResume = {
    personal_info: { full_name: 'Short Candidate', target_role: 'Junior Dev', email: 'short@example.com' },
    professional_summary: 'Eager junior developer with foundational skills.',
    education: [{ institution: 'State University', degree: 'B.S.', field_of_study: 'CS' }],
    skills: [{ category: 'Languages', skills: ['Python', 'JavaScript'] }],
  };

  const multiPageResume = {
    personal_info: {
      full_name: 'Senior Architect Candidate',
      target_role: 'Principal Distributed Systems Engineer',
      email: 'architect@example.com',
      phone: '+1 555-0188',
      location: 'San Francisco, CA',
      linkedin_url: 'linkedin.com/in/architect',
      github_url: 'github.com/architect',
    },
    professional_summary:
      'Distinguished engineer with 12+ years designing planet-scale streaming data pipelines, zero-trust consensus clusters, and multi-region microservice meshes processing 500k+ RPS.',
    work_experience: [
      {
        id: 'exp_1',
        job_title: 'Principal Systems Architect',
        company: 'Cloud Scale Global',
        location: 'San Francisco, CA',
        start_date: '2021',
        is_current: true,
        description: 'Lead architect for global transaction pipeline handling billions in volume.',
        bullet_points: [
          'Spearheaded migration to multi-active Spanner clusters, reducing global replication p99 from 240ms to 42ms.',
          'Mentored team of 24 staff engineers across infrastructure, consensus, and security tracks.',
          'Implemented raft-based consensus routing engine handling 1.2M queries/sec with zero failover packet loss.',
        ],
      },
      {
        id: 'exp_2',
        job_title: 'Staff Software Engineer',
        company: 'Distributed Edge Networks',
        location: 'Seattle, WA',
        start_date: '2017',
        end_date: '2021',
        description: 'Engineered high-throughput caching proxies and load balancers.',
        bullet_points: [
          'Designed Rust-based caching layer eliminating 80% of backend database query hotspots.',
          'Authored high-precision eBPF telemetry hooks tracing latency down to microsecond resolution.',
        ],
      },
      {
        id: 'exp_3',
        job_title: 'Senior Backend Engineer',
        company: 'Apex Data Services',
        location: 'Austin, TX',
        start_date: '2014',
        end_date: '2017',
        description: 'Built distributed ETL pipelines and financial ingestion systems.',
        bullet_points: [
          'Reduced overnight settlement batch execution from 6.5 hours to 38 minutes using Apache Spark.',
        ],
      },
    ],
    projects: [
      {
        id: 'proj_1',
        title: 'Zero-Copy Ring Buffer Consensus',
        role: 'Creator & Maintainer',
        tech_stack: ['Rust', 'DPDK', 'C++'],
        description: 'Open-source lock-free event bus operating at line-rate network throughput.',
        bullet_points: [
          'Benchmark demonstrated 48 million messages/sec sustained throughput on commodity 10GbE NICs.',
          'Adopted by 15+ production trading and telemetry infrastructures globally.',
        ],
      },
      {
        id: 'proj_2',
        title: 'Autonomous Distributed Rate Limiter',
        role: 'Lead Designer',
        tech_stack: ['Go', 'Redis', 'gRPC'],
        description: 'Sliding-window token bucket engine with probabilistic gossip sync.',
        bullet_points: ['Prevented DDoS cascades with sub-millisecond local enforcement under partition.'],
      },
      {
        id: 'proj_3',
        title: 'Unified Observability Daemon',
        role: 'Core Author',
        tech_stack: ['eBPF', 'Prometheus', 'Grafana'],
        description: 'Kernel-level network profiler collecting transport metrics without app bytecode injection.',
      },
    ],
    education: [
      {
        id: 'edu_1',
        institution: 'Carnegie Mellon University',
        degree: 'Ph.D.',
        field_of_study: 'Computer Science (Distributed Systems)',
        start_date: '2010',
        end_date: '2014',
        honors: 'Doctoral Dissertation Award Finalist',
      },
      {
        id: 'edu_2',
        institution: 'University of Washington',
        degree: 'B.S.',
        field_of_study: 'Computer Engineering',
        start_date: '2006',
        end_date: '2010',
        honors: 'Summa Cum Laude',
      },
    ],
    skills: [
      { id: 'sk_1', category: 'Distributed Systems', skills: ['Raft', 'Paxos', 'Spanner', 'Kafka', 'Cassandra'] },
      { id: 'sk_2', category: 'Languages', skills: ['Rust', 'Go', 'C++', 'Python', 'SQL'] },
      { id: 'sk_3', category: 'Infrastructure & Cloud', skills: ['Kubernetes', 'AWS', 'GCP', 'Terraform', 'eBPF'] },
    ],
    certifications: [
      { id: 'cert_1', name: 'AWS Certified Solutions Architect - Professional', issuer: 'Amazon Web Services', issue_date: '2023' },
      { id: 'cert_2', name: 'Google Cloud Professional Cloud Architect', issuer: 'Google Cloud', issue_date: '2022' },
    ],
    achievements: [
      { id: 'ach_1', title: 'Top Contributor Award', organization: 'Cloud Native Computing Foundation', date: '2023' },
    ],
    custom_sections: [
      {
        id: 'cs_1',
        title: 'Patents & Publications',
        content: 'US Patent #11,892,104: Method and apparatus for deterministic Byzantine-tolerant state machine replication.',
        bullet_points: [
          'Published "Line-rate Log Replication on Kernel-bypass Transports" in USENIX OSDI 2021.',
        ],
      },
    ],
  };

  it('renders single-page resume and verifies print rules without fixed positioning', () => {
    const { container } = render(<ResumePreview content={shortResume} templateId="modern_professional" />);

    const printArea = container.querySelector('#resume-print-area');
    expect(printArea).toBeInTheDocument();
    expect(screen.getByText('Short Candidate')).toBeInTheDocument();

    // Verify injected style tag does NOT contain position: fixed !important
    const styleTag = container.querySelector('style');
    expect(styleTag).toBeInTheDocument();
    const css = styleTag.textContent;

    expect(css).toContain('position: absolute !important');
    expect(css).not.toContain('position: fixed');
    expect(css).toContain('overflow: visible !important');
    expect(css).toContain('size: A4 portrait');
    expect(css).toContain('break-inside: auto !important');
    expect(css).toContain('break-inside: avoid');
  });

  it('renders multi-page resume across all sections without clipping or missing items', () => {
    render(<ResumePreview content={multiPageResume} templateId="modern_professional" />);

    // Verify all 3 experiences are rendered
    expect(screen.getByText(/Cloud Scale Global/i)).toBeInTheDocument();
    expect(screen.getByText(/Distributed Edge Networks/i)).toBeInTheDocument();
    expect(screen.getByText(/Apex Data Services/i)).toBeInTheDocument();

    // Verify all 3 projects are rendered
    expect(screen.getByText(/Zero-Copy Ring Buffer Consensus/i)).toBeInTheDocument();
    expect(screen.getByText(/Autonomous Distributed Rate Limiter/i)).toBeInTheDocument();
    expect(screen.getByText(/Unified Observability Daemon/i)).toBeInTheDocument();

    // Verify education, certifications, and custom section
    expect(screen.getByText(/Carnegie Mellon University/i)).toBeInTheDocument();
    expect(screen.getByText(/AWS Certified Solutions Architect/i)).toBeInTheDocument();
    expect(screen.getByText(/Patents & Publications/i)).toBeInTheDocument();
    expect(screen.getByText(/US Patent #11,892,104/i)).toBeInTheDocument();
  });

  it('renders extensive 3-page resume in Classic Academic template without clipping', () => {
    render(<ResumePreview content={multiPageResume} templateId="classic_academic" />);

    expect(screen.getByText('Senior Architect Candidate')).toBeInTheDocument();
    expect(screen.getByText(/Carnegie Mellon University/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-Copy Ring Buffer Consensus/i)).toBeInTheDocument();
    expect(screen.getByText(/Cloud Scale Global/i)).toBeInTheDocument();
    expect(screen.getByText(/Line-rate Log Replication/i)).toBeInTheDocument();
  });

  it('exports HTML scenarios for headless Chromium verification', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const scratchDir = 'C:/Users/prane/.gemini/antigravity/brain/d5093049-7164-4aea-b833-ec52742218a3/scratch';

    const cssPath = path.resolve('dist/assets/index-COxcYJTo.css');
    const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';

    const mediumTwoPageResume = {
      personal_info: {
        full_name: 'Marcus Vance',
        target_role: 'Senior Full Stack Software Engineer',
        email: 'marcus.vance@example.com',
        phone: '+1 (555) 789-0123',
        location: 'Austin, TX',
        linkedin_url: 'linkedin.com/in/marcusvance',
        github_url: 'github.com/marcusv',
      },
      professional_summary:
        'Full Stack Engineer with 7+ years of experience engineering high-concurrency cloud architectures, event-driven microservices, and reactive web applications. Proven track record leading agile engineering squads and improving system reliability across FinTech and SaaS ecosystems.',
      work_experience: [
        {
          id: 'exp_1',
          job_title: 'Senior Software Engineer',
          company: 'FinEdge Cloud Solutions',
          location: 'Austin, TX',
          start_date: '2022',
          is_current: true,
          description: 'Lead engineering contributor for core payments gateway orchestration engine.',
          bullet_points: [
            'Spearheaded transition from monolith to event-driven Go and Node.js microservices processing 45,000 TPS.',
            'Architected idempotency layer over Redis and PostgreSQL, driving transaction failure rate down by 99.4%.',
            'Implemented automated blue-green deployment pipelines on AWS ECS, slashing deployment rollbacks to zero.',
          ],
        },
        {
          id: 'exp_2',
          job_title: 'Full Stack Software Engineer',
          company: 'DataStream Analytics',
          location: 'Denver, CO',
          start_date: '2019',
          end_date: '2022',
          description: 'Built customer-facing data visualization platform and real-time query builder.',
          bullet_points: [
            'Developed interactive charting workspace in React 18, Web Workers, and D3.js handling 1M+ data points.',
            'Optimized GraphQL aggregation queries, lowering p95 response time from 1.4s to 180ms.',
            'Integrated role-based access control (RBAC) and OAuth2 / OIDC authentication for 120+ enterprise tenants.',
          ],
        },
      ],
      projects: [
        {
          id: 'proj_1',
          title: 'CloudMesh Distributed Lock Manager',
          role: 'Maintainer',
          tech_stack: ['Go', 'Raft', 'etcd'],
          start_date: '2023',
          end_date: '2024',
          description: 'Lightweight distributed lock service based on Raft consensus with lease renewal semantics.',
          bullet_points: [
            'Maintained sub-10ms lock acquisition latency across geographically distributed 5-node clusters.',
          ],
        },
      ],
      skills: [
        { id: 'sk_1', category: 'Backend & Cloud', skills: ['Go', 'Python', 'Node.js', 'FastAPI', 'PostgreSQL', 'Redis', 'AWS'] },
        { id: 'sk_2', category: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'] },
      ],
      education: [
        {
          id: 'edu_1',
          institution: 'University of Colorado Boulder',
          degree: 'B.S.',
          field_of_study: 'Computer Science',
          start_date: '2015',
          end_date: '2019',
          gpa: '3.82',
        },
      ],
      certifications: [
        { id: 'cert_1', name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', issue_date: '2022' },
      ],
      achievements: [
        { id: 'ach_1', title: 'Outstanding Engineering Achievement Award', date: '2023' },
      ],
      custom_sections: [],
    };

    const scenarios = [
      { file: 'scenario1_short.html', content: shortResume, templateId: 'modern_professional' },
      { file: 'scenario2_medium.html', content: mediumTwoPageResume, templateId: 'modern_professional' },
      { file: 'scenario3_long.html', content: multiPageResume, templateId: 'modern_professional' },
      { file: 'scenario3_long_classic.html', content: multiPageResume, templateId: 'classic_academic' },
      { file: 'scenario3_long_exec.html', content: multiPageResume, templateId: 'executive_minimal' },
    ];

    for (const sc of scenarios) {
      const { container } = render(
        <ResumePreview content={sc.content} templateId={sc.templateId} accentColor="#245A45" />
      );

      const previewHtml = container.innerHTML;

      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Resume Print Test</title>
  <style>
    ${cssContent}
  </style>
</head>
<body class="bg-slate-50 antialiased font-sans text-slate-900">
  <div id="root">
    <div class="h-screen w-full flex flex-row overflow-hidden bg-[var(--theme-bg,#F8FAFC)] text-[var(--theme-text,#0F172A)] antialiased font-sans transition-colors duration-150">
      <aside class="sidebar-container w-64 bg-white border-r border-slate-200 p-4 shrink-0">
        <h2 class="font-bold text-lg mb-4">TalentPath Navigation</h2>
        <ul class="space-y-2 text-sm text-slate-600">
          <li>Dashboard</li>
          <li class="font-bold text-indigo-600">Resume Builder</li>
          <li>ATS Scanner</li>
          <li>Mock Interview</li>
        </ul>
      </aside>
      <div class="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <header class="sticky top-0 z-30 shrink-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between shadow-xs">
          <div class="font-bold text-slate-800">TalentPath / Professional Resume Builder</div>
          <div class="text-sm text-slate-500">Candidate Workspace</div>
        </header>
        <div class="h-[calc(100vh-4rem)] p-4 sm:p-6 flex flex-col space-y-3 bg-slate-50 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
            <h1 class="text-lg font-bold">Resume Draft Editor</h1>
            <div class="space-x-2">
              <button class="px-3 py-1.5 bg-indigo-600 text-white rounded">Save Draft</button>
              <button class="px-3 py-1.5 bg-slate-800 text-white rounded">Export PDF</button>
            </div>
          </div>
          <main class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
            <div class="md:col-span-6 lg:col-span-5 h-full overflow-hidden p-4 bg-white rounded-xl border border-slate-200">
              <h2 class="font-semibold text-slate-800 mb-2">Editor Panel</h2>
              <p class="text-xs text-slate-500">Form fields...</p>
            </div>
            <div class="md:col-span-6 lg:col-span-7 h-full overflow-hidden">
              ${previewHtml}
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

      fs.writeFileSync(path.join(scratchDir, sc.file), fullHtml, 'utf8');
    }
  });
});
