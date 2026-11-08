import React from 'react';

export default function ModernProfessionalTemplate({ content = {}, accentColor = '#245A45' }) {
  const p = content.personal_info || {};
  const summary = (content.professional_summary || '').trim();
  const experience = (content.work_experience || []).filter(w => w.job_title || w.company);
  const projects = (content.projects || []).filter(pr => pr.title);
  const skills = (content.skills || []).filter(s => s.category && s.skills?.length > 0);
  const education = (content.education || []).filter(e => e.institution || e.degree);
  const internships = (content.internships || []).filter(i => i.role || i.organization);
  const certifications = (content.certifications || []).filter(c => c.name);
  const achievements = (content.achievements || []).filter(a => a.title);
  const customSections = (content.custom_sections || []).filter(cs => cs.title && (cs.content || cs.bullet_points?.length));

  return (
    <div className="w-full text-gray-900 bg-white font-sans text-[10.5pt] leading-normal p-8 sm:p-10 select-text">
      {/* Top Accent Strip */}
      <div className="h-1.5 w-full mb-6 rounded-t" style={{ backgroundColor: accentColor }} />

      {/* Header */}
      {(p.full_name || p.email || p.phone || p.target_role) && (
        <header className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-3 pb-4 border-b border-gray-200">
          <div>
            {p.full_name && (
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                {p.full_name}
              </h1>
            )}
            {p.target_role && (
              <div className="text-sm font-semibold tracking-wide mt-0.5" style={{ color: accentColor }}>
                {p.target_role}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1 md:text-right">
            {p.email && <span>{p.email}</span>}
            {p.phone && <span>• {p.phone}</span>}
            {p.location && <span>• {p.location}</span>}
            {p.linkedin_url && <span>• {p.linkedin_url}</span>}
            {p.github_url && <span>• {p.github_url}</span>}
            {p.portfolio_url && <span>• {p.portfolio_url}</span>}
          </div>
        </header>
      )}

      {/* Professional Summary */}
      {summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            About
          </h2>
          <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* Work Experience */}
      {experience.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Experience
          </h2>
          <div className="space-y-4">
            {experience.map(exp => (
              <div key={exp.id || exp.job_title}>
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-xs sm:text-sm text-gray-900">
                    {exp.job_title}
                    {exp.company && <span className="font-medium text-gray-600"> @ {exp.company}</span>}
                  </div>
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
                    {[exp.start_date, exp.is_current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {exp.location && <div className="text-xs text-gray-500">{exp.location}</div>}
                {exp.description && <p className="text-xs text-gray-700 mt-1">{exp.description}</p>}
                {exp.bullet_points && exp.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 mt-1.5 ml-1">
                    {exp.bullet_points.filter(b => b?.trim()).map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Key Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map(proj => (
              <div key={proj.id || proj.title}>
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-xs sm:text-sm text-gray-900">
                    {proj.title}
                    {proj.role && <span className="text-xs font-normal text-gray-600"> ({proj.role})</span>}
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noreferrer" className="text-xs font-normal ml-2 text-blue-600 underline">
                        link
                      </a>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {[proj.start_date, proj.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1 mb-1">
                    {proj.tech_stack.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {proj.description && <p className="text-xs text-gray-700 mb-1">{proj.description}</p>}
                {proj.bullet_points && proj.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 ml-1">
                    {proj.bullet_points.filter(b => b?.trim()).map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Skills & Competencies
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {skills.map(s => (
              <div key={s.id || s.category} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                <span className="font-semibold text-gray-800 min-w-[140px]">{s.category}:</span>
                <span className="text-gray-700">{s.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Education
          </h2>
          <div className="space-y-2.5">
            {education.map(edu => (
              <div key={edu.id || edu.institution}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-semibold text-gray-900">{edu.institution}</span>
                  <span className="text-xs font-medium text-gray-500">
                    {[edu.start_date, edu.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                <div className="text-xs text-gray-700">
                  {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ')}
                  {edu.gpa && <span className="font-medium text-gray-800"> (GPA: {edu.gpa})</span>}
                </div>
                {edu.honors && <div className="text-xs text-gray-500">{edu.honors}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Internships */}
      {internships.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Internships
          </h2>
          <div className="space-y-3">
            {internships.map(intern => (
              <div key={intern.id || intern.role}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-semibold text-gray-900">
                    {intern.role}
                    {intern.organization && <span className="font-normal text-gray-600"> @ {intern.organization}</span>}
                  </span>
                  <span className="text-xs font-medium text-gray-500">
                    {[intern.start_date, intern.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {intern.description && <p className="text-xs text-gray-700 mt-1">{intern.description}</p>}
                {intern.bullet_points && intern.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 mt-1 ml-1">
                    {intern.bullet_points.filter(b => b?.trim()).map((bullet, i) => (
                      <li key={i}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Certifications
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {certifications.map(cert => (
              <div key={cert.id || cert.name} className="p-2 rounded bg-gray-50 border border-gray-100">
                <div className="font-semibold text-gray-900">{cert.name}</div>
                {cert.issuer && <div className="text-gray-600">{cert.issuer}</div>}
                {cert.issue_date && <div className="text-gray-500 text-[10px]">{cert.issue_date}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            Achievements
          </h2>
          <div className="space-y-2 text-xs">
            {achievements.map(ach => (
              <div key={ach.id || ach.title}>
                <div className="flex justify-between items-baseline font-semibold text-gray-900">
                  <span>{ach.title}</span>
                  {ach.date && <span className="text-gray-500 font-normal">{ach.date}</span>}
                </div>
                {ach.description && <p className="text-gray-700 mt-0.5">{ach.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.map(cs => (
        <section key={cs.id || cs.title} className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-wider pb-1 mb-2 border-b-2 flex items-center gap-2"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: accentColor }} />
            {cs.title}
          </h2>
          {cs.content && <p className="text-xs sm:text-sm text-gray-700 mb-1">{cs.content}</p>}
          {cs.bullet_points && cs.bullet_points.filter(b => b?.trim()).length > 0 && (
            <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 ml-1">
              {cs.bullet_points.filter(b => b?.trim()).map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
