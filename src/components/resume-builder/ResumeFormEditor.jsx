import React, { useState } from 'react';
import {
  User,
  FileText,
  GraduationCap,
  Wrench,
  FolderGit2,
  Briefcase,
  Award,
  Trophy,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
} from 'lucide-react';

const SECTIONS = [
  { id: 'personal_info', label: 'Personal Info', icon: User },
  { id: 'professional_summary', label: 'Summary', icon: FileText },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'work_experience', label: 'Experience', icon: Briefcase },
  { id: 'internships', label: 'Internships', icon: Briefcase },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'custom_sections', label: 'Custom', icon: Layers },
];

function CommaSeparatedInput({ value = [], onChange, placeholder, className }) {
  const [text, setText] = useState(() => (value || []).join(', '));
  const [prevValue, setPrevValue] = useState(value);

  // Synchronize when the external value prop changes
  if (value !== prevValue) {
    setPrevValue(value);
    const currentParsed = text.split(',').map(s => s.trim()).filter(Boolean);
    const incoming = value || [];
    const isDifferent =
      currentParsed.length !== incoming.length ||
      currentParsed.some((s, i) => s !== incoming[i]);
    if (isDifferent) {
      setText(incoming.join(', '));
    }
  }

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    const parsed = val.split(',').map(s => s.trim()).filter(Boolean);
    onChange(parsed);
  };

  return (
    <input
      type="text"
      value={text}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function ResumeFormEditor({ content = {}, onChange }) {
  const [activeTab, setActiveTab] = useState('personal_info');

  const updatePersonalInfo = (field, value) => {
    onChange({
      ...content,
      personal_info: {
        ...(content.personal_info || {}),
        [field]: value,
      },
    });
  };

  const updateSummary = value => {
    onChange({
      ...content,
      professional_summary: value,
    });
  };

  const updateList = (sectionKey, newList) => {
    onChange({
      ...content,
      [sectionKey]: newList,
    });
  };

  const addItem = (sectionKey, defaultItem) => {
    const list = content[sectionKey] || [];
    updateList(sectionKey, [...list, { ...defaultItem, id: `item_${Date.now()}` }]);
  };

  const removeItem = (sectionKey, index) => {
    const list = [...(content[sectionKey] || [])];
    list.splice(index, 1);
    updateList(sectionKey, list);
  };

  const moveItem = (sectionKey, index, direction) => {
    const list = [...(content[sectionKey] || [])];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    updateList(sectionKey, list);
  };

  const updateItemField = (sectionKey, index, field, value) => {
    const list = [...(content[sectionKey] || [])];
    list[index] = { ...list[index], [field]: value };
    updateList(sectionKey, list);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Horizontal Section Navigation Bar */}
      <div className="flex border-b border-slate-200 bg-slate-50/70 overflow-x-auto scrollbar-none px-2 pt-2 gap-1 text-xs">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const isActive = activeTab === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveTab(s.id)}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-t-lg font-medium whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-emerald-700' : 'text-slate-400'} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 1. PERSONAL INFO */}
        {activeTab === 'personal_info' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Candidate Information</h3>
              <p className="text-xs text-slate-500">
                Contact details and target job title. Only filled fields appear on your resume.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={content.personal_info?.full_name || ''}
                  onChange={e => updatePersonalInfo('full_name', e.target.value)}
                  placeholder="e.g. Alex Chen"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Role</label>
                <input
                  type="text"
                  value={content.personal_info?.target_role || ''}
                  onChange={e => updatePersonalInfo('target_role', e.target.value)}
                  placeholder="e.g. Full Stack Software Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={content.personal_info?.email || ''}
                  onChange={e => updatePersonalInfo('email', e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={content.personal_info?.phone || ''}
                  onChange={e => updatePersonalInfo('phone', e.target.value)}
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={content.personal_info?.location || ''}
                  onChange={e => updatePersonalInfo('location', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="text"
                  value={content.personal_info?.linkedin_url || ''}
                  onChange={e => updatePersonalInfo('linkedin_url', e.target.value)}
                  placeholder="linkedin.com/in/alexchen"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">GitHub URL</label>
                <input
                  type="text"
                  value={content.personal_info?.github_url || ''}
                  onChange={e => updatePersonalInfo('github_url', e.target.value)}
                  placeholder="github.com/alexchen"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Portfolio / Website</label>
                <input
                  type="text"
                  value={content.personal_info?.portfolio_url || ''}
                  onChange={e => updatePersonalInfo('portfolio_url', e.target.value)}
                  placeholder="alexchen.dev"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. SUMMARY */}
        {activeTab === 'professional_summary' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Professional Summary</h3>
              <p className="text-xs text-slate-500">
                A concise 2–4 sentence summary highlighting your core expertise, career trajectory, and strongest technical capabilities.
              </p>
            </div>
            <div>
              <textarea
                rows={6}
                value={content.professional_summary || ''}
                onChange={e => updateSummary(e.target.value)}
                placeholder="Software Engineer with 3+ years of experience in distributed systems and cloud architecture. Passionate about building resilient microservices and low-latency APIs..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* 3. EDUCATION */}
        {activeTab === 'education' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Education</h3>
                <p className="text-xs text-slate-500">Add degrees, universities, and academic milestones.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('education', {
                    institution: '',
                    degree: '',
                    field_of_study: '',
                    start_date: '',
                    end_date: '',
                    gpa: '',
                    honors: '',
                    location: '',
                    coursework: '',
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Education</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.education || []).map((edu, idx) => (
                <div key={edu.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {edu.institution || 'New Institution'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('education', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('education', idx, 1)}
                        disabled={idx === (content.education || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('education', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Institution</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={e => updateItemField('education', idx, 'institution', e.target.value)}
                        placeholder="e.g. University of California, Berkeley"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={e => updateItemField('education', idx, 'degree', e.target.value)}
                        placeholder="e.g. Bachelor of Science"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field_of_study || ''}
                        onChange={e => updateItemField('education', idx, 'field_of_study', e.target.value)}
                        placeholder="e.g. Computer Science"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">GPA (Optional)</label>
                      <input
                        type="text"
                        value={edu.gpa || ''}
                        onChange={e => updateItemField('education', idx, 'gpa', e.target.value)}
                        placeholder="e.g. 3.8 / 4.0"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={edu.start_date || ''}
                        onChange={e => updateItemField('education', idx, 'start_date', e.target.value)}
                        placeholder="e.g. Aug 2020"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">End Date</label>
                      <input
                        type="text"
                        value={edu.end_date || ''}
                        onChange={e => updateItemField('education', idx, 'end_date', e.target.value)}
                        placeholder="e.g. May 2024"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Honors / Distinctions</label>
                      <input
                        type="text"
                        value={edu.honors || ''}
                        onChange={e => updateItemField('education', idx, 'honors', e.target.value)}
                        placeholder="e.g. Summa Cum Laude, Dean's List"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Location</label>
                      <input
                        type="text"
                        value={edu.location || ''}
                        onChange={e => updateItemField('education', idx, 'location', e.target.value)}
                        placeholder="e.g. Berkeley, CA"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!content.education || content.education.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No education records yet. Click "Add Education" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. TECHNICAL SKILLS */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Skills & Competencies</h3>
                <p className="text-xs text-slate-500">Group your skills by category (e.g. Languages, Frameworks, Tools).</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('skills', {
                    category: '',
                    skills: [],
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.skills || []).map((skillGroup, idx) => (
                <div key={skillGroup.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {skillGroup.category || 'New Skill Category'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('skills', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('skills', idx, 1)}
                        disabled={idx === (content.skills || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('skills', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Category Title</label>
                      <input
                        type="text"
                        value={skillGroup.category || ''}
                        onChange={e => updateItemField('skills', idx, 'category', e.target.value)}
                        placeholder="e.g. Languages & Frameworks, Cloud & DevOps, Databases"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Skills (comma-separated)</label>
                      <CommaSeparatedInput
                        value={skillGroup.skills || []}
                        onChange={arr => updateItemField('skills', idx, 'skills', arr)}
                        placeholder="e.g. Python, TypeScript, React, Docker, PostgreSQL"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!content.skills || content.skills.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No skill categories yet. Click "Add Category" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Projects</h3>
                <p className="text-xs text-slate-500">Showcase technical projects with impact, tech stacks, and bullet points.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('projects', {
                    title: '',
                    role: '',
                    tech_stack: [],
                    start_date: '',
                    end_date: '',
                    url: '',
                    description: '',
                    bullet_points: [''],
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Project</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.projects || []).map((proj, idx) => (
                <div key={proj.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {proj.title || 'New Project'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('projects', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('projects', idx, 1)}
                        disabled={idx === (content.projects || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('projects', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Project Title</label>
                      <input
                        type="text"
                        value={proj.title || ''}
                        onChange={e => updateItemField('projects', idx, 'title', e.target.value)}
                        placeholder="e.g. Distributed Task Orchestrator"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Your Role</label>
                      <input
                        type="text"
                        value={proj.role || ''}
                        onChange={e => updateItemField('projects', idx, 'role', e.target.value)}
                        placeholder="e.g. Lead Developer"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Technologies (comma-separated)</label>
                      <CommaSeparatedInput
                        value={proj.tech_stack || []}
                        onChange={arr => updateItemField('projects', idx, 'tech_stack', arr)}
                        placeholder="e.g. Go, Redis, Docker, gRPC"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Project / GitHub URL</label>
                      <input
                        type="text"
                        value={proj.url || ''}
                        onChange={e => updateItemField('projects', idx, 'url', e.target.value)}
                        placeholder="e.g. github.com/user/project"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={proj.start_date || ''}
                        onChange={e => updateItemField('projects', idx, 'start_date', e.target.value)}
                        placeholder="e.g. Jan 2024"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">End Date</label>
                      <input
                        type="text"
                        value={proj.end_date || ''}
                        onChange={e => updateItemField('projects', idx, 'end_date', e.target.value)}
                        placeholder="e.g. Apr 2024"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-700">Achievement Bullet Points</label>
                      <button
                        type="button"
                        onClick={() => {
                          const pts = [...(proj.bullet_points || []), ''];
                          updateItemField('projects', idx, 'bullet_points', pts);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(proj.bullet_points || []).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2">
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={pt}
                          onChange={e => {
                            const pts = [...(proj.bullet_points || [])];
                            pts[pIdx] = e.target.value;
                            updateItemField('projects', idx, 'bullet_points', pts);
                          }}
                          placeholder="Architected concurrent queue reducing task latency by 45%..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const pts = [...(proj.bullet_points || [])];
                            pts.splice(pIdx, 1);
                            updateItemField('projects', idx, 'bullet_points', pts);
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!content.projects || content.projects.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No projects added yet. Click "Add Project" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. WORK EXPERIENCE */}
        {activeTab === 'work_experience' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Work Experience</h3>
                <p className="text-xs text-slate-500">Document your full-time, part-time, or contract professional roles.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('work_experience', {
                    job_title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                    description: '',
                    bullet_points: [''],
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Experience</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.work_experience || []).map((exp, idx) => (
                <div key={exp.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {exp.job_title || 'New Position'} {exp.company && `@ ${exp.company}`}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('work_experience', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('work_experience', idx, 1)}
                        disabled={idx === (content.work_experience || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('work_experience', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Job Title</label>
                      <input
                        type="text"
                        value={exp.job_title || ''}
                        onChange={e => updateItemField('work_experience', idx, 'job_title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={e => updateItemField('work_experience', idx, 'company', e.target.value)}
                        placeholder="e.g. Acme Cloud Corp"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={e => updateItemField('work_experience', idx, 'location', e.target.value)}
                        placeholder="e.g. Seattle, WA (Remote)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={exp.start_date || ''}
                        onChange={e => updateItemField('work_experience', idx, 'start_date', e.target.value)}
                        placeholder="e.g. Jan 2022"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">End Date</label>
                      <input
                        type="text"
                        value={exp.end_date || ''}
                        disabled={exp.is_current}
                        onChange={e => updateItemField('work_experience', idx, 'end_date', e.target.value)}
                        placeholder={exp.is_current ? 'Present' : 'e.g. Dec 2023'}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-50"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center space-x-2 cursor-pointer text-slate-700">
                        <input
                          type="checkbox"
                          checked={exp.is_current || false}
                          onChange={e => updateItemField('work_experience', idx, 'is_current', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>Currently working here</span>
                      </label>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-700">Accomplishments & Impact</label>
                      <button
                        type="button"
                        onClick={() => {
                          const pts = [...(exp.bullet_points || []), ''];
                          updateItemField('work_experience', idx, 'bullet_points', pts);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(exp.bullet_points || []).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2">
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={pt}
                          onChange={e => {
                            const pts = [...(exp.bullet_points || [])];
                            pts[pIdx] = e.target.value;
                            updateItemField('work_experience', idx, 'bullet_points', pts);
                          }}
                          placeholder="Engineered automated deployment pipeline cutting release time from 40m to 4m..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const pts = [...(exp.bullet_points || [])];
                            pts.splice(pIdx, 1);
                            updateItemField('work_experience', idx, 'bullet_points', pts);
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!content.work_experience || content.work_experience.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No work experience entries yet. Click "Add Experience" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. INTERNSHIPS */}
        {activeTab === 'internships' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Internships & Research</h3>
                <p className="text-xs text-slate-500">Student internships, lab assistantships, or research fellowships.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('internships', {
                    role: '',
                    organization: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    description: '',
                    bullet_points: [''],
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Internship</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.internships || []).map((intern, idx) => (
                <div key={intern.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {intern.role || 'New Internship'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('internships', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('internships', idx, 1)}
                        disabled={idx === (content.internships || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('internships', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Role Title</label>
                      <input
                        type="text"
                        value={intern.role || ''}
                        onChange={e => updateItemField('internships', idx, 'role', e.target.value)}
                        placeholder="e.g. Software Engineering Intern"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Organization / Lab</label>
                      <input
                        type="text"
                        value={intern.organization || ''}
                        onChange={e => updateItemField('internships', idx, 'organization', e.target.value)}
                        placeholder="e.g. Google"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Location</label>
                      <input
                        type="text"
                        value={intern.location || ''}
                        onChange={e => updateItemField('internships', idx, 'location', e.target.value)}
                        placeholder="e.g. Mountain View, CA"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Start Date</label>
                      <input
                        type="text"
                        value={intern.start_date || ''}
                        onChange={e => updateItemField('internships', idx, 'start_date', e.target.value)}
                        placeholder="e.g. Jun 2023"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">End Date</label>
                      <input
                        type="text"
                        value={intern.end_date || ''}
                        onChange={e => updateItemField('internships', idx, 'end_date', e.target.value)}
                        placeholder="e.g. Aug 2023"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-700">Internship Deliverables</label>
                      <button
                        type="button"
                        onClick={() => {
                          const pts = [...(intern.bullet_points || []), ''];
                          updateItemField('internships', idx, 'bullet_points', pts);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(intern.bullet_points || []).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2">
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={pt}
                          onChange={e => {
                            const pts = [...(intern.bullet_points || [])];
                            pts[pIdx] = e.target.value;
                            updateItemField('internships', idx, 'bullet_points', pts);
                          }}
                          placeholder="Implemented caching layer reducing endpoint response time by 30%..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const pts = [...(intern.bullet_points || [])];
                            pts.splice(pIdx, 1);
                            updateItemField('internships', idx, 'bullet_points', pts);
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!content.internships || content.internships.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No internships added yet. Click "Add Internship" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. CERTIFICATIONS */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Certifications</h3>
                <p className="text-xs text-slate-500">Industry licenses, cloud credentials, and accredited certifications.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('certifications', {
                    name: '',
                    issuer: '',
                    issue_date: '',
                    expiration_date: '',
                    credential_id: '',
                    credential_url: '',
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Certification</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.certifications || []).map((cert, idx) => (
                <div key={cert.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {cert.name || 'New Certification'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('certifications', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('certifications', idx, 1)}
                        disabled={idx === (content.certifications || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('certifications', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Certification Name</label>
                      <input
                        type="text"
                        value={cert.name || ''}
                        onChange={e => updateItemField('certifications', idx, 'name', e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect - Associate"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Issuing Organization</label>
                      <input
                        type="text"
                        value={cert.issuer || ''}
                        onChange={e => updateItemField('certifications', idx, 'issuer', e.target.value)}
                        placeholder="e.g. Amazon Web Services"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Issue Date</label>
                      <input
                        type="text"
                        value={cert.issue_date || ''}
                        onChange={e => updateItemField('certifications', idx, 'issue_date', e.target.value)}
                        placeholder="e.g. Nov 2023"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Credential ID (Optional)</label>
                      <input
                        type="text"
                        value={cert.credential_id || ''}
                        onChange={e => updateItemField('certifications', idx, 'credential_id', e.target.value)}
                        placeholder="e.g. AWS-10928374"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!content.certifications || content.certifications.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No certifications added yet. Click "Add Certification" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. ACHIEVEMENTS */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Achievements & Honors</h3>
                <p className="text-xs text-slate-500">Awards, hackathons, open-source recognitions, and competitive milestones.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('achievements', {
                    title: '',
                    organization: '',
                    date: '',
                    description: '',
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Achievement</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.achievements || []).map((ach, idx) => (
                <div key={ach.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {ach.title || 'New Achievement'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('achievements', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('achievements', idx, 1)}
                        disabled={idx === (content.achievements || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('achievements', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Title</label>
                      <input
                        type="text"
                        value={ach.title || ''}
                        onChange={e => updateItemField('achievements', idx, 'title', e.target.value)}
                        placeholder="e.g. 1st Place - National AI Hackathon"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Organization / Event</label>
                      <input
                        type="text"
                        value={ach.organization || ''}
                        onChange={e => updateItemField('achievements', idx, 'organization', e.target.value)}
                        placeholder="e.g. Major League Hacking"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Date</label>
                      <input
                        type="text"
                        value={ach.date || ''}
                        onChange={e => updateItemField('achievements', idx, 'date', e.target.value)}
                        placeholder="e.g. Oct 2023"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Description</label>
                      <input
                        type="text"
                        value={ach.description || ''}
                        onChange={e => updateItemField('achievements', idx, 'description', e.target.value)}
                        placeholder="Out of 120+ teams, built an AI tutor with realtime speech feedback"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!content.achievements || content.achievements.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No achievements added yet. Click "Add Achievement" to begin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 10. CUSTOM SECTIONS */}
        {activeTab === 'custom_sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Custom Sections</h3>
                <p className="text-xs text-slate-500">Add bespoke sections such as Publications, Volunteer Work, or Languages.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  addItem('custom_sections', {
                    title: '',
                    content: '',
                    bullet_points: [''],
                  })
                }
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-medium hover:bg-emerald-800 transition"
              >
                <Plus size={13} />
                <span>Add Custom Section</span>
              </button>
            </div>

            <div className="space-y-4">
              {(content.custom_sections || []).map((cs, idx) => (
                <div key={cs.id || idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-700">
                      #{idx + 1} {cs.title || 'New Custom Section'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => moveItem('custom_sections', idx, -1)}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem('custom_sections', idx, 1)}
                        disabled={idx === (content.custom_sections || []).length - 1}
                        className="p-1 hover:bg-slate-200 rounded text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem('custom_sections', idx)}
                        className="p-1 hover:bg-red-50 text-red-600 rounded ml-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1">Section Title</label>
                      <input
                        type="text"
                        value={cs.title || ''}
                        onChange={e => updateItemField('custom_sections', idx, 'title', e.target.value)}
                        placeholder="e.g. Publications & Patents, Volunteer Leadership"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Overview / Content</label>
                      <textarea
                        rows={2}
                        value={cs.content || ''}
                        onChange={e => updateItemField('custom_sections', idx, 'content', e.target.value)}
                        placeholder="Summary of this section..."
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <label className="font-medium text-slate-700">Bullet Items</label>
                      <button
                        type="button"
                        onClick={() => {
                          const pts = [...(cs.bullet_points || []), ''];
                          updateItemField('custom_sections', idx, 'bullet_points', pts);
                        }}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {(cs.bullet_points || []).map((pt, pIdx) => (
                      <div key={pIdx} className="flex items-center space-x-2">
                        <span className="text-slate-400">•</span>
                        <input
                          type="text"
                          value={pt}
                          onChange={e => {
                            const pts = [...(cs.bullet_points || [])];
                            pts[pIdx] = e.target.value;
                            updateItemField('custom_sections', idx, 'bullet_points', pts);
                          }}
                          placeholder="Details..."
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const pts = [...(cs.bullet_points || [])];
                            pts.splice(pIdx, 1);
                            updateItemField('custom_sections', idx, 'bullet_points', pts);
                          }}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(!content.custom_sections || content.custom_sections.length === 0) && (
                <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No custom sections added yet. Click "Add Custom Section" to begin.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
