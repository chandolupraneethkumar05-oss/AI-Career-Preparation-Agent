import React from 'react';

export default function ExecutiveMinimalTemplate({ content = {}, accentColor = '#245A45' }) {
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

  // Build contact row
  const contactItems = [];
  if (p.email) contactItems.push(p.email);
  if (p.phone) contactItems.push(p.phone);
  if (p.location) contactItems.push(p.location);
  if (p.linkedin_url) contactItems.push(p.linkedin_url);
  if (p.github_url) contactItems.push(p.github_url);
  if (p.portfolio_url) contactItems.push(p.portfolio_url);

  return (
    <div className="w-full text-slate-900 bg-white font-sans text-[10pt] leading-normal p-8 sm:p-12 select-text">
      {/* Header */}
      {(p.full_name || p.target_role || contactItems.length > 0) && (
        <header className="mb-8">
          {p.full_name && (
            <h1 className="text-3xl font-light tracking-tight text-slate-900 mb-1">
              {p.full_name}
            </h1>
          )}
          {p.target_role && (
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: accentColor }}
            >
              {p.target_role}
            </div>
          )}
          {contactItems.length > 0 && (
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              {contactItems.map((item, idx) => (
                <span key={idx}>{item}</span>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Executive Profile
          </h2>
          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Experience & Leadership
          </h2>
          <div className="space-y-4">
            {experience.map(exp => (
              <div key={exp.id || exp.job_title}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-semibold text-xs sm:text-sm text-slate-900">{exp.job_title}</span>
                    {exp.company && <span className="text-slate-600 font-normal"> · {exp.company}</span>}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {[exp.start_date, exp.is_current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {exp.location && <div className="text-[11px] text-slate-400 italic mb-1">{exp.location}</div>}
                {exp.description && <p className="text-xs text-slate-700 mb-1">{exp.description}</p>}
                {exp.bullet_points && exp.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
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
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Key Initiatives & Projects
          </h2>
          <div className="space-y-3.5">
            {projects.map(proj => (
              <div key={proj.id || proj.title}>
                <div className="flex justify-between items-baseline">
                  <div className="font-semibold text-xs sm:text-sm text-slate-900">
                    {proj.title}
                    {proj.role && <span className="font-normal text-slate-600"> · {proj.role}</span>}
                    {proj.url && (
                      <span className="font-normal text-[11px] ml-2 text-slate-400">[{proj.url}]</span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {[proj.start_date, proj.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="text-[11px] text-slate-500 mb-1">
                    <span className="font-medium text-slate-600">Technologies:</span> {proj.tech_stack.join(', ')}
                  </div>
                )}
                {proj.description && <p className="text-xs text-slate-700 mb-1">{proj.description}</p>}
                {proj.bullet_points && proj.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
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
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Core Competencies
          </h2>
          <div className="space-y-1 text-xs">
            {skills.map(s => (
              <div key={s.id || s.category} className="flex flex-col sm:flex-row sm:items-baseline gap-1">
                <span className="font-semibold text-slate-800 min-w-[150px]">{s.category}:</span>
                <span className="text-slate-600">{s.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Education & Credentials
          </h2>
          <div className="space-y-2">
            {education.map(edu => (
              <div key={edu.id || edu.institution} className="flex justify-between items-baseline text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{edu.institution}</span>
                  <div className="text-slate-600">
                    {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ')}
                    {edu.gpa && ` · GPA: ${edu.gpa}`}
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {[edu.start_date, edu.end_date].filter(Boolean).join(' – ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Internships */}
      {internships.length > 0 && (
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Internships
          </h2>
          <div className="space-y-3">
            {internships.map(intern => (
              <div key={intern.id || intern.role}>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-semibold text-slate-900">
                    {intern.role}
                    {intern.organization && <span className="font-normal text-slate-600"> · {intern.organization}</span>}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {[intern.start_date, intern.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {intern.description && <p className="text-xs text-slate-700 mt-1">{intern.description}</p>}
                {intern.bullet_points && intern.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400 mt-1">
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
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Certifications
          </h2>
          <div className="space-y-1 text-xs">
            {certifications.map(cert => (
              <div key={cert.id || cert.name} className="flex justify-between items-baseline">
                <div>
                  <span className="font-medium text-slate-900">{cert.name}</span>
                  {cert.issuer && <span className="text-slate-500"> · {cert.issuer}</span>}
                </div>
                {cert.issue_date && <span className="text-[11px] text-slate-400">{cert.issue_date}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Honors & Distinctions
          </h2>
          <div className="space-y-1.5 text-xs">
            {achievements.map(ach => (
              <div key={ach.id || ach.title}>
                <div className="flex justify-between items-baseline font-medium text-slate-900">
                  <span>{ach.title}</span>
                  {ach.date && <span className="text-[11px] text-slate-400 font-normal">{ach.date}</span>}
                </div>
                {ach.description && <p className="text-slate-600 mt-0.5">{ach.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.map(cs => (
        <section key={cs.id || cs.title} className="mb-6 pt-3 border-t border-slate-200">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            {cs.title}
          </h2>
          {cs.content && <p className="text-xs text-slate-700 mb-1">{cs.content}</p>}
          {cs.bullet_points && cs.bullet_points.filter(b => b?.trim()).length > 0 && (
            <ul className="text-xs text-slate-700 space-y-1 ml-4 list-disc marker:text-slate-400">
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
