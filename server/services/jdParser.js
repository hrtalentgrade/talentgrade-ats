import fs from 'fs';

// Predefined dictionaries for pattern matching
const SKILLS_DICT = [
  'React', 'Node.js', 'Express', 'SQLite', 'PostgreSQL', 'SQL', 'MongoDB', 'Python', 'Java', 
  'Javascript', 'TypeScript', 'HTML', 'CSS', 'Sourcing', 'Talent Acquisition', 'HR', 'Excel', 
  'GitHub', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Git', 'ICU', 'Critical Care', 'Pediatric',
  'Adult Care', 'Emergency', 'Trauma', 'Patient Care', 'Clinical', 'Nursing', 'Sales', 'Marketing',
  'B2B', 'Financial Analysis', 'Accounting', 'Audit', 'CPA', 'Project Management'
];

const SOFT_SKILLS_DICT = [
  'Communication', 'Teamwork', 'Leadership', 'Problem Solving', 'Time Management', 
  'Adaptability', 'Conflict Resolution', 'Critical Thinking', 'Interpersonal', 'Negotiation'
];

const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'Human Resources', 'Finance', 'Nursing', 'Operations', 'IT Support', 'Legal'];
const LANGUAGES = ['English', 'Arabic', 'Hindi', 'Spanish', 'French', 'German', 'Mandarin'];
const CERTIFICATIONS = ['DHA', 'MOH', 'HAAD', 'BLS', 'ACLS', 'CPA', 'PMP', 'AWS Certified', 'Scrum Master'];

export function parseJobDescription(text) {
  if (!text) text = '';
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lowercaseText = text.toLowerCase();

  // 1. Job Title
  let title = 'Not Specified';
  if (lines.length > 0) {
    // Usually the first line is the title
    for (const line of lines) {
      if (line.length < 60 && !line.toLowerCase().includes('job description') && !line.toLowerCase().includes('hiring')) {
        title = line;
        break;
      }
    }
  }

  // 2. Company Name
  let company = 'TalentGrade Client';
  const companyMatch = text.match(/(?:company|employer|client)\s*:\s*([^\n]+)/i);
  if (companyMatch) {
    company = companyMatch[1].trim();
  }

  // 3. Location & 4. Country
  let location = 'Not Specified';
  let country = 'Not Specified';
  const locMatch = text.match(/(?:location|city)\s*[:\-]?\s*([^\n,]+)(?:,\s*([^\n]+))?/i);
  if (locMatch) {
    location = locMatch[1].trim();
    if (locMatch[2]) country = locMatch[2].trim();
  }
  // Try fallback country search
  if (country === 'Not Specified') {
    if (lowercaseText.includes('uae') || lowercaseText.includes('dubai') || lowercaseText.includes('abu dhabi')) {
      country = 'United Arab Emirates';
    } else if (lowercaseText.includes('india') || lowercaseText.includes('bangalore') || lowercaseText.includes('mumbai') || lowercaseText.includes('pune')) {
      country = 'India';
      if (location === 'Not Specified') location = 'India';
    } else if (lowercaseText.includes('uk') || lowercaseText.includes('london')) {
      country = 'United Kingdom';
    } else if (lowercaseText.includes('usa') || lowercaseText.includes('us ') || lowercaseText.includes('new york') || lowercaseText.includes('california')) {
      country = 'United States';
    }
  }

  // 5. Department
  let department = 'Recruitment';
  for (const dept of DEPARTMENTS) {
    if (new RegExp(`\\b${dept}\\b`, 'i').test(text)) {
      department = dept;
      break;
    }
  }

  // 6. Employment Type
  let employmentType = 'Full-time';
  if (lowercaseText.includes('part-time') || lowercaseText.includes('part time')) employmentType = 'Part-time';
  else if (lowercaseText.includes('contract') || lowercaseText.includes('temporary')) employmentType = 'Contract';
  else if (lowercaseText.includes('freelance')) employmentType = 'Freelance';
  else if (lowercaseText.includes('internship') || lowercaseText.includes('intern')) employmentType = 'Internship';

  // 7. Experience Required
  let experienceRequired = 'Not Specified';
  const expMatch = text.match(/(?:experience|exp)(?:[\s\w]*)(?:required|minimum)?\s*[:\-]?\s*(\d+(?:\s*-\s*\d+|\s*\+)?\s*(?:years?|yrs?))/i);
  if (expMatch) {
    experienceRequired = expMatch[1].trim();
  } else {
    const expMatchAlt = text.match(/(\d+(?:\s*-\s*\d+|\s*\+)?\s*(?:years?|yrs?)(?:[\s\w]*)(?:experience|exp))/i);
    if (expMatchAlt) experienceRequired = expMatchAlt[1].trim();
  }

  // 8. Education Required
  let educationRequired = 'Bachelor\'s Degree';
  if (lowercaseText.includes('master') || lowercaseText.includes('mba') || lowercaseText.includes('postgraduate')) {
    educationRequired = 'Master\'s Degree';
  } else if (lowercaseText.includes('phd') || lowercaseText.includes('doctorate')) {
    educationRequired = 'PhD / Doctorate';
  } else if (lowercaseText.includes('diploma')) {
    educationRequired = 'Diploma';
  } else if (lowercaseText.includes('high school')) {
    educationRequired = 'High School Graduate';
  }

  // 9. Mandatory Skills & 21. Priority Skills
  const mandatorySkills = [];
  for (const skill of SKILLS_DICT) {
    if (new RegExp(`\\b${skill}\\b`, 'i').test(text)) {
      mandatorySkills.push(skill);
    }
  }
  // If no specific skills found, grab keywords from target_profiles equivalent
  if (mandatorySkills.length === 0) {
    mandatorySkills.push('Technical proficiency');
  }
  const prioritySkills = mandatorySkills.slice(0, 3); // Pick top 3 as priority

  // 10. Preferred Skills
  const preferredSkills = [];
  if (mandatorySkills.length > 3) {
    preferredSkills.push(...mandatorySkills.slice(3, 6));
  } else {
    preferredSkills.push('Problem-solving', 'Critical thinking');
  }

  // 11. Languages Required
  const languagesRequired = [];
  for (const lang of LANGUAGES) {
    if (new RegExp(`\\b${lang}\\b`, 'i').test(text)) {
      languagesRequired.push(lang);
    }
  }
  if (languagesRequired.length === 0) languagesRequired.push('English');

  // 12. Nationality Preference
  let nationalityPreference = 'Open to all nationalities';
  const natMatch = text.match(/(?:nationality|nationalities|citizenship)\s*preference\s*[:\-]?\s*([^\n]+)/i);
  if (natMatch) {
    nationalityPreference = natMatch[1].trim();
  }

  // 13. Gender Preference
  let genderPreference = 'No Preference';
  if (lowercaseText.includes('male preferred') || lowercaseText.includes('only male')) genderPreference = 'Male';
  else if (lowercaseText.includes('female preferred') || lowercaseText.includes('only female')) genderPreference = 'Female';

  // 14. Salary Range
  let salaryRange = 'Negotiable / Competetive';
  const salMatch = text.match(/(?:salary|budget|ctc|package)\s*[:\-]?\s*([^\n]+)/i);
  if (salMatch) {
    salaryRange = salMatch[1].trim();
  }

  // 15. Benefits
  let benefits = 'Standard Corporate Benefits';
  const benIndex = lowercaseText.indexOf('benefit');
  if (benIndex !== -1) {
    const benSection = text.substring(benIndex, benIndex + 250);
    const benLines = benSection.split('\n').slice(1, 4).map(l => l.trim()).filter(l => l.length > 0);
    if (benLines.length > 0) benefits = benLines.join(', ');
  }

  // 16. Visa Requirements
  let visaRequirements = 'Company provided / Candidates with own visa eligible';
  if (lowercaseText.includes('own visa') || lowercaseText.includes('spouse visa')) {
    visaRequirements = 'Must have own visa / Spouse sponsor visa';
  } else if (lowercaseText.includes('citizen only') || lowercaseText.includes('local national')) {
    visaRequirements = 'Citizen or Permanent Resident only';
  }

  // 17. License Requirements
  let licenseRequirements = 'None';
  const licMatch = text.match(/(?:license|registration)\s*(?:required)?\s*[:\-]?\s*([^\n]+)/i);
  if (licMatch) {
    licenseRequirements = licMatch[1].trim();
  } else {
    // Fallback search for specific medical licenses
    if (lowercaseText.includes('dha license') || lowercaseText.includes('dha registered')) licenseRequirements = 'Active DHA License';
    else if (lowercaseText.includes('moh license') || lowercaseText.includes('moh registered')) licenseRequirements = 'Active MOH License';
    else if (lowercaseText.includes('haad license') || lowercaseText.includes('haad registered')) licenseRequirements = 'Active HAAD/DOH License';
  }

  // 18. Certifications
  const certsList = [];
  for (const cert of CERTIFICATIONS) {
    if (new RegExp(`\\b${cert}\\b`, 'i').test(text)) {
      certsList.push(cert);
    }
  }
  let certifications = certsList.length > 0 ? certsList.join(', ') : 'Not Specified';

  // 19. Interview Process
  let interviewProcess = 'Standard (HR Screening -> Technical -> Management Round)';
  const intIndex = lowercaseText.indexOf('interview');
  if (intIndex !== -1) {
    const intSection = text.substring(intIndex, intIndex + 200);
    const intLines = intSection.split('\n').slice(0, 3).map(l => l.trim()).filter(l => l.length > 0 && l.includes('->'));
    if (intLines.length > 0) interviewProcess = intLines[0];
  }

  // 20. Joining Timeline
  let joiningTimeline = 'Immediate to 30 days';
  if (lowercaseText.includes('immediate joiner') || lowercaseText.includes('join immediately')) {
    joiningTimeline = 'Immediate';
  } else if (lowercaseText.includes('notice period') && lowercaseText.includes('90 days')) {
    joiningTimeline = '90 days notice period acceptable';
  }

  // 22. Keywords
  const keywords = mandatorySkills.concat(location, department).slice(0, 6);

  // 23. Soft Skills
  const softSkills = [];
  for (const ss of SOFT_SKILLS_DICT) {
    if (new RegExp(`\\b${ss}\\b`, 'i').test(text)) {
      softSkills.push(ss);
    }
  }
  if (softSkills.length === 0) softSkills.push('Communication', 'Teamwork');

  // 24. Job Responsibilities
  let jobResponsibilities = 'As described in vacancy documentation.';
  const respKeywords = ['responsibilities', 'duties', 'what you will do', 'role overview', 'responsibilty'];
  for (const rk of respKeywords) {
    const idx = lowercaseText.indexOf(rk);
    if (idx !== -1) {
      const section = text.substring(idx, idx + 400);
      const linesSec = section.split('\n').slice(1, 6).map(l => l.trim().replace(/^[\-\*\u2022]\s*/, '')).filter(l => l.length > 10);
      if (linesSec.length > 0) {
        jobResponsibilities = linesSec.join('. ') + '.';
        break;
      }
    }
  }

  const analysis = {
    title,
    company,
    location,
    country,
    department,
    employmentType,
    experienceRequired,
    educationRequired,
    mandatorySkills: mandatorySkills.join(', '),
    preferredSkills: preferredSkills.join(', '),
    languagesRequired: languagesRequired.join(', '),
    nationalityPreference,
    genderPreference,
    salaryRange,
    benefits,
    visaRequirements,
    licenseRequirements,
    certifications,
    interviewProcess,
    joiningTimeline,
    prioritySkills: prioritySkills.join(', '),
    keywords: keywords.join(', '),
    softSkills: softSkills.join(', '),
    jobResponsibilities
  };

  // Generate Questions & Checklist
  const questions = generateInterviewQuestions(analysis);
  const checklist = generateEligibilityChecklist(analysis);

  return {
    analysis,
    questions,
    checklist
  };
}

function generateInterviewQuestions(analysis) {
  const sections = {
    basic: [
      { id: 'b_intro', text: 'Can you introduce yourself and walk me through your career history?' },
      { id: 'b_working', text: 'Are you currently working, and what is your official designation?' },
      { id: 'b_change', text: 'Why are you looking for a career change at this stage?' }
    ],
    experience: [],
    skills: [],
    certifications: []
  };

  // 1. Experience Verification questions
  const expTerm = analysis.experienceRequired !== 'Not Specified' ? analysis.experienceRequired : 'relevant';
  sections.experience.push({
    id: 'e_years',
    text: `How many years of professional experience do you have matching the required ${expTerm} experience?`
  });

  if (analysis.department === 'Nursing' || analysis.jobResponsibilities.toLowerCase().includes('icu') || analysis.jobResponsibilities.toLowerCase().includes('patient')) {
    sections.experience.push({ id: 'e_icu_beds', text: 'How many ICU beds does your current hospital contain, and what types of cases (Adult/Pediatric/Trauma) do you handle?' });
    sections.experience.push({ id: 'e_equip', text: 'What ventilators, cardiac monitors, or critical-care medical equipment are you experienced in operating?' });
  } else {
    sections.experience.push({ id: 'e_projects', text: `Describe a complex project or task you successfully completed as a ${analysis.title}.` });
    sections.experience.push({ id: 'e_challenges', text: 'What is the biggest operational challenge you faced in your current role and how did you resolve it?' });
  }

  // 2. Skill Verification questions
  const skills = analysis.prioritySkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
  skills.forEach((skill, idx) => {
    sections.skills.push({
      id: `s_${idx}`,
      text: `Tell me about your hands-on experience working with ${skill}. Describe a production use-case or workflow.`
    });
  });
  if (sections.skills.length === 0) {
    sections.skills.push({ id: 's_default', text: 'What technical tools or operational frameworks do you use daily, and how do they benefit your output?' });
  }

  // 3. Certification & License questions
  if (analysis.licenseRequirements && analysis.licenseRequirements !== 'None') {
    sections.certifications.push({
      id: 'c_license_active',
      text: `Do you hold an active license/registration for: ${analysis.licenseRequirements}? What is the license number?`
    });
    sections.certifications.push({
      id: 'c_license_expiry',
      text: 'Is the license currently active, and what is its expiration date?'
    });
  }
  
  if (analysis.certifications && analysis.certifications !== 'Not Specified') {
    sections.certifications.push({
      id: 'c_certs_hold',
      text: `Do you hold active certifications for: ${analysis.certifications}?`
    });
  }

  if (sections.certifications.length === 0) {
    sections.certifications.push({ id: 'c_default', text: 'Are there any industry-specific certifications, degrees, or licenses you hold that are active?' });
  }

  return sections;
}

function generateEligibilityChecklist(analysis) {
  const criteria = [
    { key: 'exp_match', label: 'Experience Matches JD Criteria', type: 'boolean', desc: `Requires ${analysis.experienceRequired}` },
    { key: 'edu_match', label: 'Education Level matches requirements', type: 'boolean', desc: `Requires ${analysis.educationRequired}` },
    { key: 'salary_budget', label: 'Salary expected fits within client budget range', type: 'boolean', desc: `Client budget: ${analysis.salaryRange}` },
    { key: 'notice_period', label: 'Notice Period matches client onboarding timeline', type: 'boolean', desc: `Timeline: ${analysis.joiningTimeline}` }
  ];

  if (analysis.licenseRequirements && analysis.licenseRequirements !== 'None') {
    criteria.push({ key: 'license_avail', label: `Active License Available: ${analysis.licenseRequirements}`, type: 'boolean', desc: 'Active registration verified' });
  }

  if (analysis.nationalityPreference && !analysis.nationalityPreference.toLowerCase().includes('open to all')) {
    criteria.push({ key: 'nationality_match', label: `Nationality matches preference: ${analysis.nationalityPreference}`, type: 'boolean', desc: 'Demographic match' });
  }

  if (analysis.location && analysis.location !== 'Not Specified') {
    criteria.push({ key: 'location_match', label: `Location/Relocation acceptable: ${analysis.location}`, type: 'boolean', desc: `Role base is ${analysis.location}` });
  }

  return criteria;
}
