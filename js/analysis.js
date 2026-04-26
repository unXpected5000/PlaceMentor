function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function titleCase(value) {
  return String(value || "")
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function calculateProfileStrength(student) {
  const skillCount = Math.min((student.skills || []).length, 6);
  const score =
    (clamp(Number(student.cgpa || 0), 0, 10) / 10) * 40 +
    (clamp(Number(student.resumeScore || 0), 0, 100) / 100) * 35 +
    (clamp(Number(student.softSkillsScore || 0), 0, 100) / 100) * 10 +
    (clamp(Number(student.aptitudeScore || 0), 0, 100) / 100) * 5 +
    skillCount * 3;
  return Math.round(clamp(score, 0, 100));
}

export function getCompanyMatch(student, company) {
  const studentSkills = (student.skills || []).map((skill) => skill.toLowerCase());
  const requiredSkills = (company.requiredSkills || []).map((skill) => skill.toLowerCase());
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.includes(skill));
  const missingSkills = requiredSkills.filter((skill) => !studentSkills.includes(skill));
  const departmentMatch =
    !(company.eligibleDepartments || []).length ||
    company.eligibleDepartments.includes(student.department);
  const cgpaEligible = Number(student.cgpa || 0) >= Number(company.minCGPA || 0);
  const resumeEligible = Number(student.resumeScore || 0) >= Number(company.minResumeScore || 0);

  const score =
    (departmentMatch ? 20 : 0) +
    (cgpaEligible ? 20 : clamp((Number(student.cgpa || 0) / Math.max(Number(company.minCGPA || 1), 1)) * 20, 0, 20)) +
    (resumeEligible ? 20 : clamp((Number(student.resumeScore || 0) / Math.max(Number(company.minResumeScore || 1), 1)) * 20, 0, 20)) +
    (requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 40 : 30);

  return {
    ...company,
    eligible: departmentMatch && cgpaEligible && resumeEligible,
    matchScore: Math.round(clamp(score, 0, 100)),
    matchedSkills,
    missingSkills,
    gapSummary: missingSkills.length
      ? `Add ${missingSkills.slice(0, 3).map(titleCase).join(", ")}`
      : "No major skill gaps",
  };
}

export function getCompanyMatches(student, companies) {
  return companies
    .map((company) => getCompanyMatch(student, company))
    .sort((left, right) => right.matchScore - left.matchScore);
}

export function getEligibleCompanies(student, companies) {
  return getCompanyMatches(student, companies).filter((match) => match.eligible);
}

export function getBestFitRole(student, companies) {
  const roleScores = {};
  getCompanyMatches(student, companies).forEach((company) => {
    company.roles.forEach((role) => {
      roleScores[role] = (roleScores[role] || 0) + company.matchScore;
    });
  });

  const bestEntry = Object.entries(roleScores).sort((a, b) => b[1] - a[1])[0];
  return bestEntry?.[0] || student.predictedRole || "Graduate Trainee";
}

export function getSuggestedCourses(student, companies) {
  const topMatches = getCompanyMatches(student, companies).slice(0, 5);
  const missing = unique(topMatches.flatMap((company) => company.missingSkills || []));
  return missing.slice(0, 6).map((skill) => ({
    skill,
    area: `${titleCase(skill)} Foundation`,
    reason: `Appears across company requirements for ${student.department.toUpperCase()} profiles.`,
  }));
}

export function getPlacementTips(student, companies) {
  const tips = [];
  const matches = getCompanyMatches(student, companies);
  const topMissing = unique(matches.slice(0, 3).flatMap((company) => company.missingSkills || []));

  if (Number(student.cgpa || 0) < 7) {
    tips.push("Raise academic consistency to clear more CGPA cutoffs in upcoming drives.");
  }
  if (Number(student.resumeScore || 0) < 75) {
    tips.push("Improve resume impact statements and quantify project outcomes with clear metrics.");
  }
  if ((student.skills || []).length < 4) {
    tips.push("Expand your technical stack with role-specific tools to increase match scores.");
  }
  if (topMissing.length) {
    tips.push(`Prioritize ${topMissing.slice(0, 3).map(titleCase).join(", ")} to unlock more eligible companies.`);
  }
  if (!tips.length) {
    tips.push("Your profile is competitive. Focus on mock interviews and company-specific role preparation.");
  }
  return tips;
}

export function getReadiness(student, companies) {
  const profileStrength = calculateProfileStrength(student);
  const eligibleCompanies = getEligibleCompanies(student, companies).length;
  const label =
    profileStrength >= 80 && eligibleCompanies >= 5
      ? "High"
      : profileStrength >= 65 && eligibleCompanies >= 2
        ? "Moderate"
        : "Developing";
  return {
    label,
    score: profileStrength,
    eligibleCompanies,
  };
}

export function getStudentInsights(student, companies, resume) {
  const profileStrength = calculateProfileStrength(student);
  const companyMatches = getCompanyMatches(student, companies);
  const eligibleCompanies = companyMatches.filter((item) => item.eligible);
  const bestFitRole = getBestFitRole(student, companies);
  const suggestedCourses = getSuggestedCourses(student, companies);
  const placementTips = getPlacementTips(student, companies);
  const readiness = getReadiness(student, companies);
  const resumeBreakdown = {
    structure: Math.round(clamp((resume?.score || student.resumeScore || 0) * 0.35, 0, 35)),
    content: Math.round(clamp((student.resumeScore || 0) * 0.3, 0, 30)),
    skills: Math.round(clamp((student.skills || []).length * 5, 0, 20)),
    impact: Math.round(clamp((student.softSkillsScore || 0) * 0.15, 0, 15)),
  };

  return {
    profileStrength,
    companyMatches,
    eligibleCompanies,
    bestFitRole,
    suggestedCourses,
    placementTips,
    readiness,
    gapAnalysis: unique(companyMatches.slice(0, 3).flatMap((company) => company.missingSkills)).slice(0, 6),
    resumeBreakdown,
  };
}

export function buildAnalytics(students, companies) {
  const totalStudents = students.length;
  const placedStudents = students.filter((student) => student.placementStatus === "Placed").length;
  const avgCgpa = average(students.map((student) => student.cgpa));
  const avgResumeScore = average(students.map((student) => student.resumeScore));

  const departmentRows = Object.entries(
    students.reduce((accumulator, student) => {
      const key = student.department || "unknown";
      if (!accumulator[key]) {
        accumulator[key] = { total: 0, placed: 0, avgResume: 0, avgCgpa: 0 };
      }
      accumulator[key].total += 1;
      accumulator[key].placed += student.placementStatus === "Placed" ? 1 : 0;
      accumulator[key].avgResume += Number(student.resumeScore || 0);
      accumulator[key].avgCgpa += Number(student.cgpa || 0);
      return accumulator;
    }, {})
  ).map(([department, stats]) => ({
    department,
    total: stats.total,
    placed: stats.placed,
    placementRate: Math.round((stats.placed / stats.total) * 100),
    avgResume: Math.round(stats.avgResume / stats.total),
    avgCgpa: Number((stats.avgCgpa / stats.total).toFixed(2)),
  }));

  const roleDemand = Object.entries(
    companies.reduce((accumulator, company) => {
      company.roles.forEach((role) => {
        accumulator[role] = (accumulator[role] || 0) + 1;
      });
      return accumulator;
    }, {})
  )
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => right.count - left.count);

  return {
    totalStudents,
    placedStudents,
    avgCgpa: Number(avgCgpa.toFixed(2)),
    avgResumeScore: Math.round(avgResumeScore),
    departmentRows,
    roleDemand,
  };
}
