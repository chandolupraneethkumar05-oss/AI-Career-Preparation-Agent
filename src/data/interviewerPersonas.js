/**
 * Interviewer Personas configuration
 * Defines distinct AI interviewer personas with specialized archetypes,
 * voice characteristics, and avatar styling.
 */

export const INTERVIEWER_PERSONAS = [
  {
    id: 'julian',
    name: 'Dr. Julian Vance',
    title: 'Principal Systems Architect',
    organization: 'Ex-Google & MIT CSAIL',
    archetype: 'Systematic & Deep Technical Inquiry',
    description: 'Specializes in distributed systems, scalability trade-offs, and rigorous algorithmic reasoning.',
    voiceSettings: {
      pitch: 0.95,
      rate: 0.98,
      preferredGender: 'male',
      langCode: 'en-US'
    },
    accentColor: '#1A365D',
    badgeVariant: 'navy',
    avatarStyle: {
      hairColor: '#4A4036',
      skinTone: '#EAC8A9',
      suitColor: '#1B2A4A',
      tieColor: '#8C6E54',
      glasses: true
    },
    introGreeting: 'Welcome to your oral defense session. I will be reviewing your architecture and technical problem-solving capabilities today. Take your time to articulate your rationale clearly.'
  },
  {
    id: 'sarah',
    name: 'Sarah Lin',
    title: 'VP of Engineering',
    organization: 'High-Growth Cloud & Platform',
    archetype: 'Architecture Trade-offs & Strategic Execution',
    description: 'Focuses on production viability, operational resilience, cloud topologies, and cross-functional leadership.',
    voiceSettings: {
      pitch: 1.1,
      rate: 1.02,
      preferredGender: 'female',
      langCode: 'en-US'
    },
    accentColor: '#8C6E54',
    badgeVariant: 'bronze',
    avatarStyle: {
      hairColor: '#2B2520',
      skinTone: '#F2D3B8',
      suitColor: '#2E2824',
      tieColor: '#1A365D',
      glasses: false
    },
    introGreeting: 'Hello, glad to meet you. In this session, we will assess your pragmatic decision-making, engineering principles, and how you manage trade-offs in production systems.'
  },
  {
    id: 'marcus',
    name: 'Marcus Chen',
    title: 'Senior Engineering Director',
    organization: 'Fintech & Mission-Critical Infrastructure',
    archetype: 'STAR Behavioral, Leadership & Culture',
    description: 'Evaluates conflict resolution, technical ownership, engineering culture, and STAR situational frameworks.',
    voiceSettings: {
      pitch: 1.0,
      rate: 1.0,
      preferredGender: 'male',
      langCode: 'en-US'
    },
    accentColor: '#235E3B',
    badgeVariant: 'emerald',
    avatarStyle: {
      hairColor: '#302A24',
      skinTone: '#DFB591',
      suitColor: '#1F2937',
      tieColor: '#235E3B',
      glasses: false
    },
    introGreeting: 'Welcome. I am looking forward to our discussion. I am interested in hearing how you navigate complex leadership challenges, team dynamics, and high-stakes technical decisions.'
  }
];

export function getInterviewerPersona(id) {
  return INTERVIEWER_PERSONAS.find(p => p.id === id) || INTERVIEWER_PERSONAS[0];
}
