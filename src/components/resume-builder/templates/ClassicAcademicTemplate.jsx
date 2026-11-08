import React from 'react';

export default function ClassicAcademicTemplate({ content = {}, accentColor = '#245A45' }) {
  const p = content.personal_info || {};
  const summary = (content.professional_summary || '').trim();
  const education = (content.education || []).filter(e => e.institution || e.degree);
  const skills = (content.skills || []).filter(s => s.category && s.skills?.length > 0);
  const projects = (content.projects || []).filter(pr => pr.title);
  const experience = (content.work_experience || []).filter(w => w.job_title || w.company);
  const internships = (content.internships || []).filter(i => i.role || i.organization);
  const certifications = (content.certifications || []).filter(c => c.name);
  const achievements = (content.achievements || []).filter(a => a.title);
  const customSections = (content.custom_sections || []).filter(cs => cs.title && (cs.content || cs.bullet_points?.length));

  // Build contact line elements
  const contactParts = [];
  if (p.phone) contactParts.push(p.phone);
  if (p.email) contactParts.push(p.email);
  if (p.location) contactParts.push(p.location);
  if (p.linkedin_url) contactParts.push(p.linkedin_url);
  if (p.github_url) contactParts.push(p.github_url);
  if (p.portfolio_url) contactParts.push(p.portfolio_url);

  return (
    <div className="w-full text-gray-900 bg-white font-serif text-[11pt] leading-relaxed p-8 sm:p-10 select-text">
      {/* Centered Header */}
      {(p.full_name || contactParts.length > 0 || p.target_role) && (
        <header className="text-center mb-6 border-b border-gray-300 pb-4">
          {p.full_name && (
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-1">
              {p.full_name}
            </h1>
          )}
          {p.target_role && (
            <div className="text-sm font-medium tracking-wide uppercase text-gray-600 mb-2">
              {p.target_role}
            </div>
          )}
          {contactParts.length > 0 && (
            <div className="text-xs text-gray-600 space-x-2 flex flex-wrap justify-center items-center">
              {contactParts.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400">|</span>}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          )}
        </header>
      )}

      {/* Summary */}
      {summary && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Professional Summary
          </h2>
          <p className="text-xs sm:text-sm text-gray-800 text-justify leading-normal">{summary}</p>
        </section>
      )}

      {/* Education (Prominent in Academic template) */}
      {education.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Education
          </h2>
          <div className="space-y-3">
            {education.map(edu => (
              <div key={edu.id || edu.institution}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-bold text-gray-900">{edu.institution}</span>
                  <span className="text-xs text-gray-600 italic">
                    {[edu.start_date, edu.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                <div className="flex justify-between items-baseline text-xs text-gray-700 italic">
                  <span>
                    {[edu.degree, edu.field_of_study].filter(Boolean).join(' in ')}
                    {edu.gpa && ` • GPA: ${edu.gpa}`}
                  </span>
                  {edu.location && <span>{edu.location}</span>}
                </div>
                {edu.honors && <div className="text-xs text-gray-600 mt-0.5">Honors: {edu.honors}</div>}
                {edu.coursework && <div className="text-xs text-gray-600 mt-0.5">Relevant Coursework: {edu.coursework}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Technical Skills */}
      {skills.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Technical & Professional Skills
          </h2>
          <div className="space-y-1 text-xs sm:text-sm">
            {skills.map(s => (
              <div key={s.id || s.category}>
                <span className="font-bold text-gray-800">{s.category}: </span>
                <span className="text-gray-700">{s.skills.join(', ')}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Projects
          </h2>
          <div className="space-y-3">
            {projects.map(proj => (
              <div key={proj.id || proj.title}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <div className="font-bold text-gray-900">
                    {proj.title}
                    {proj.role && <span className="font-normal italic text-gray-700"> – {proj.role}</span>}
                    {proj.url && (
                      <span className="font-normal text-xs ml-2 text-gray-500">[{proj.url}]</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-600 italic">
                    {[proj.start_date, proj.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {proj.tech_stack && proj.tech_stack.length > 0 && (
                  <div className="text-xs text-gray-600 italic mb-1">
                    Technologies: {proj.tech_stack.join(', ')}
                  </div>
                )}
                {proj.description && <p className="text-xs text-gray-800 mb-1">{proj.description}</p>}
                {proj.bullet_points && proj.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-800 space-y-0.5 ml-2">
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

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Professional Experience
          </h2>
          <div className="space-y-3">
            {experience.map(exp => (
              <div key={exp.id || exp.job_title}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-bold text-gray-900">
                    {exp.job_title}
                    {exp.company && <span className="font-normal">, {exp.company}</span>}
                  </span>
                  <span className="text-xs text-gray-600 italic">
                    {[exp.start_date, exp.is_current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {exp.location && <div className="text-xs text-gray-600 italic">{exp.location}</div>}
                {exp.description && <p className="text-xs text-gray-800 mt-1 mb-1">{exp.description}</p>}
                {exp.bullet_points && exp.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-800 space-y-0.5 ml-2 mt-1">
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

      {/* Internships */}
      {internships.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Internships & Research
          </h2>
          <div className="space-y-3">
            {internships.map(intern => (
              <div key={intern.id || intern.role}>
                <div className="flex justify-between items-baseline text-xs sm:text-sm">
                  <span className="font-bold text-gray-900">
                    {intern.role}
                    {intern.organization && <span className="font-normal">, {intern.organization}</span>}
                  </span>
                  <span className="text-xs text-gray-600 italic">
                    {[intern.start_date, intern.end_date].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {intern.location && <div className="text-xs text-gray-600 italic">{intern.location}</div>}
                {intern.description && <p className="text-xs text-gray-800 mt-1 mb-1">{intern.description}</p>}
                {intern.bullet_points && intern.bullet_points.filter(b => b?.trim()).length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-800 space-y-0.5 ml-2 mt-1">
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
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Certifications
          </h2>
          <div className="space-y-1.5 text-xs sm:text-sm">
            {certifications.map(cert => (
              <div key={cert.id || cert.name} className="flex justify-between items-baseline">
                <div>
                  <span className="font-semibold text-gray-900">{cert.name}</span>
                  {cert.issuer && <span className="text-gray-700"> – {cert.issuer}</span>}
                  {cert.credential_id && (
                    <span className="text-xs text-gray-500 ml-2">ID: {cert.credential_id}</span>
                  )}
                </div>
                {cert.issue_date && (
                  <span className="text-xs text-gray-600 italic">{cert.issue_date}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <section className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Honors & Achievements
          </h2>
          <div className="space-y-2 text-xs sm:text-sm">
            {achievements.map(ach => (
              <div key={ach.id || ach.title}>
                <div className="flex justify-between items-baseline">
                  <span className="font-semibold text-gray-900">
                    {ach.title}
                    {ach.organization && <span className="font-normal"> ({ach.organization})</span>}
                  </span>
                  {ach.date && <span className="text-xs text-gray-600 italic">{ach.date}</span>}
                </div>
                {ach.description && <p className="text-xs text-gray-700 mt-0.5">{ach.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Custom Sections */}
      {customSections.map(cs => (
        <section key={cs.id || cs.title} className="mb-5">
          <h2
            className="text-xs font-bold uppercase tracking-widest pb-1 mb-2 border-b"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            {cs.title}
          </h2>
          {cs.content && <p className="text-xs sm:text-sm text-gray-800 mb-1">{cs.content}</p>}
          {cs.bullet_points && cs.bullet_points.filter(b => b?.trim()).length > 0 && (
            <ul className="list-disc list-inside text-xs text-gray-800 space-y-0.5 ml-2">
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
