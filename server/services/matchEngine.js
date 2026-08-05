export function calculateMatchScore(candidate, vacancy, screeningAnswers = null) {
  // If vacancy has no JD analysis, return default scores
  let jdAnalysis = null;
  try {
    if (vacancy.jd_analysis) {
      jdAnalysis = typeof vacancy.jd_analysis === 'string' 
        ? JSON.parse(vacancy.jd_analysis) 
        : vacancy.jd_analysis;
    }
  } catch (err) {
    console.error('Error parsing jd_analysis JSON:', err);
  }

  if (!jdAnalysis) {
    return {
      scores: {
        Overall: 70, Skill: 75, Experience: 70, Education: 80, Location: 60, License: 100, Salary: 80
      },
      missingInfo: ['Expected Salary', 'Notice Period'],
      aiRecommendation: 'Maybe',
      aiReasoning: 'Vacancy has no parsed Job Description. Automated screening is running on fallback mode.'
    };
  }

  // 1. Skill Match
  const jdMandatory = jdAnalysis.mandatorySkills.split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  const candSkills = (candidate.skills || '').split(',').map(s => s.trim().toLowerCase()).filter(s => s.length > 0);
  
  let skillMatchScore = 50; // default base
  if (jdMandatory.length > 0) {
    let matched = 0;
    jdMandatory.forEach(s => {
      if (candSkills.some(cs => cs.includes(s) || s.includes(cs))) {
        matched++;
      }
    });
    skillMatchScore = Math.round((matched / jdMandatory.length) * 100);
    // bound between 10% and 100%
    skillMatchScore = Math.max(10, Math.min(100, skillMatchScore));
  }

  // 2. Experience Match
  let expMatchScore = 70;
  let jdExpYears = 0;
  const jdExpMatch = jdAnalysis.experienceRequired.match(/(\d+)/);
  if (jdExpMatch) jdExpYears = parseInt(jdExpMatch[1]);

  const candExp = candidate.experience_years || 0;
  if (jdExpYears > 0) {
    if (candExp >= jdExpYears) {
      expMatchScore = 100;
    } else {
      expMatchScore = Math.round((candExp / jdExpYears) * 100);
      expMatchScore = Math.max(10, expMatchScore);
    }
  } else {
    expMatchScore = 100; // No specific experience required
  }

  // 3. Education Match
  let eduMatchScore = 80;
  const jdEdu = jdAnalysis.educationRequired.toLowerCase();
  const candEdu = (candidate.education || 'bachelor').toLowerCase(); // assume Bachelor as baseline

  if (candEdu.includes('phd') || candEdu.includes('doctorate')) {
    eduMatchScore = 100;
  } else if (candEdu.includes('master') || candEdu.includes('mba')) {
    eduMatchScore = jdEdu.includes('phd') ? 70 : 100;
  } else if (candEdu.includes('bachelor') || candEdu.includes('degree')) {
    eduMatchScore = jdEdu.includes('phd') ? 50 : jdEdu.includes('master') ? 75 : 100;
  }

  // 4. Location Match
  let locMatchScore = 40;
  const jdLoc = jdAnalysis.location.toLowerCase();
  const candLoc = (candidate.location || '').toLowerCase();
  
  if (candLoc.includes(jdLoc) || jdLoc.includes(candLoc)) {
    locMatchScore = 100;
  } else if (screeningAnswers && (screeningAnswers.willing_to_relocate === true || screeningAnswers.willing_to_relocate === 'Yes')) {
    locMatchScore = 90; // relocation willing
  }

  // 5. License Match
  let licenseMatchScore = 100;
  const jdLicense = jdAnalysis.licenseRequirements.toLowerCase();
  if (jdLicense && jdLicense !== 'none') {
    licenseMatchScore = 0;
    const candCerts = (candidate.skills || '').toLowerCase(); // search certificates / skills
    if (candCerts.includes(jdLicense) || candCerts.includes('dha') || candCerts.includes('moh') || candCerts.includes('haad')) {
      licenseMatchScore = 100;
    }
    // Check screening answers override
    if (screeningAnswers && (screeningAnswers.license === 'Yes' || screeningAnswers.license === true)) {
      licenseMatchScore = 100;
    }
  }

  // 6. Salary Match
  let salaryMatchScore = 80;
  // Client budget parse
  let clientBudgetMax = 0;
  const salMatch = jdAnalysis.salaryRange.match(/(\d+)/g);
  if (salMatch && salMatch.length > 0) {
    clientBudgetMax = Math.max(...salMatch.map(Number));
  }

  const expectedSalary = candidate.expected_salary || 0;
  if (clientBudgetMax > 0 && expectedSalary > 0) {
    if (expectedSalary <= clientBudgetMax) {
      salaryMatchScore = 100;
    } else {
      salaryMatchScore = Math.round((clientBudgetMax / expectedSalary) * 100);
      salaryMatchScore = Math.max(10, Math.min(100, salaryMatchScore));
    }
  }

  // 7. Overall Match Score (Weighted)
  // Weights: Skill: 30%, Exp: 25%, License: 15%, Location: 10%, Salary: 10%, Education: 10%
  const overallMatchScore = Math.round(
    (skillMatchScore * 0.3) +
    (expMatchScore * 0.25) +
    (licenseMatchScore * 0.15) +
    (locMatchScore * 0.1) +
    (salaryMatchScore * 0.1) +
    (eduMatchScore * 0.1)
  );

  // Missing Information check
  const missingInfo = [];
  if (!candidate.expected_salary) missingInfo.push('Expected Salary');
  if (!candidate.current_salary) missingInfo.push('Current Salary');
  if (!candidate.notice_period_days) missingInfo.push('Notice Period');
  if (jdAnalysis.licenseRequirements !== 'None' && licenseMatchScore === 0) {
    missingInfo.push('License Number / Details');
  }

  // AI Recommendation Recommendation
  let aiRecommendation = 'Maybe';
  let aiReasoning = '';

  if (overallMatchScore >= 85 && licenseMatchScore === 100) {
    aiRecommendation = 'Recommended';
    aiReasoning = `Candidate displays a strong match of ${overallMatchScore}% with critical parameters. Required skills (${jdAnalysis.prioritySkills}) are present. Experience of ${candExp} years aligns with targets.`;
  } else if (overallMatchScore >= 60 && licenseMatchScore === 100) {
    aiRecommendation = 'Maybe';
    aiReasoning = `Moderate match of ${overallMatchScore}%. Core requirements are satisfied, but gaps exist in salary alignment or specific technical stack overlap. Relocation willingness should be checked.`;
  } else {
    aiRecommendation = 'Not Suitable';
    if (licenseMatchScore === 0) {
      aiReasoning = `Not Suitable. Candidate lacks the mandatory regulatory license (${jdAnalysis.licenseRequirements}) required for this position.`;
    } else {
      aiReasoning = `Low match rating (${overallMatchScore}%). Candidate's skills and professional experience fall below the minimum thresholds defined in the vacancy details.`;
    }
  }

  return {
    scores: {
      Overall: overallMatchScore,
      Skill: skillMatchScore,
      Experience: expMatchScore,
      Education: eduMatchScore,
      Location: locMatchScore,
      License: licenseMatchScore,
      Salary: salaryMatchScore
    },
    missingInfo,
    aiRecommendation,
    aiReasoning
  };
}

export function generateFollowUpQuestions(answers, missingInfo) {
  const followUps = [];

  if (missingInfo && missingInfo.includes('Notice Period')) {
    followUps.push({
      key: 'f_notice',
      text: 'Candidate has not listed a notice period. Can they join immediately, or what is their official contract notice timeline?'
    });
  }

  if (missingInfo && missingInfo.includes('License Number / Details')) {
    followUps.push({
      key: 'f_license_num',
      text: 'What is your professional nursing/medical registration license number, and is it verified active on the registry portal?'
    });
  }

  // Dynamic checks on answers
  if (answers) {
    // Relocation check
    if (answers.willing_to_relocate === 'No' || answers.willing_to_relocate === false) {
      followUps.push({
        key: 'f_relocate',
        text: 'The candidate is not willing to relocate. Are they open to hybrid models or remote operations, or is local travel acceptable?'
      });
    }

    // Notice Period checks
    if (parseInt(answers.notice_period) >= 60) {
      followUps.push({
        key: 'f_notice_buyout',
        text: 'Notice period is 60+ days. Is there a buyout option available, or can the current employer release them earlier?'
      });
    }

    // Hospital / Nursing specific checks
    if (answers.relevant_experience && answers.relevant_experience.toLowerCase().includes('icu')) {
      followUps.push({
        key: 'f_icu_beds',
        text: 'You mentioned ICU experience. How many ICU beds are in your current facility, and do you specialize in Neonatal, Pediatric, or Adult cases?'
      });
    }
  }

  return followUps;
}
export default { calculateMatchScore, generateFollowUpQuestions };
