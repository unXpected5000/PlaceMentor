function countOverlap(studentSkills = [], companySkills = []) {
  const companySkillSet = new Set(companySkills.map((skill) => skill.toLowerCase()));
  return studentSkills.filter((skill) =>
    companySkillSet.has(skill.toLowerCase())
  ).length;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function buildCompanyOutcomeStats(students = []) {
  const stats = {};

  students.forEach((student) => {
    const companyName = normalizeText(student.profile?.placedCompany);
    if (!companyName) {
      return;
    }

    if (!stats[companyName]) {
      stats[companyName] = {
        placements: 0,
        roleHits: 0,
      };
    }

    stats[companyName].placements += 1;
    const finalRole = normalizeText(student.profile?.finalRole);
    const predictedRole = normalizeText(student.prediction?.predictedRole);
    if (finalRole && predictedRole && finalRole === predictedRole) {
      stats[companyName].roleHits += 1;
    }
  });

  return stats;
}

function buildCompanyMatches(student, companies, options = {}) {
  const profile = student.profile || {};
  const skills = profile.skills || [];
  const outcomeStats = options.outcomeStats || {};
  const predictedRole = normalizeText(student.prediction?.predictedRole);

  return companies
    .map((company) => {
      const matchedSkillCount = countOverlap(skills, company.requiredSkills || []);
      const eligibilityReasons = [];
      const companyStats = outcomeStats[normalizeText(company.name)] || {
        placements: 0,
        roleHits: 0,
      };
      const roleAligned =
        predictedRole && normalizeText(company.role) === predictedRole;

      const eligibleCgpa = (profile.cgpa || 0) >= (company.minCgpa || 0);
      const eligibleBacklogs =
        company.maxBacklogs == null || (profile.backlogs || 0) <= company.maxBacklogs;

      if (eligibleCgpa) {
        eligibilityReasons.push("CGPA eligible");
      }

      if (matchedSkillCount > 0) {
        eligibilityReasons.push(`${matchedSkillCount} skill matches`);
      }

      if (roleAligned) {
        eligibilityReasons.push("Role aligned with prediction");
      }

      if (companyStats.placements > 0) {
        eligibilityReasons.push(`${companyStats.placements} historical placements`);
      }

      const score =
        matchedSkillCount * 18 +
        Math.max(0, ((profile.cgpa || 0) - (company.minCgpa || 0)) * 10) +
        ((student.prediction?.placementProbability || 0) * 0.25) +
        (roleAligned ? 14 : 0) +
        Math.min(companyStats.placements * 3, 12) +
        (companyStats.roleHits > 0 ? 4 : 0);

      return {
        ...company,
        eligible: eligibleCgpa && eligibleBacklogs,
        matchedSkillCount,
        matchScore: Math.max(0, Math.min(100, Math.round(score))),
        eligibilityReasons,
        recommendationReason: roleAligned
          ? "Recommended because the company role aligns with the predicted role."
          : "Recommended based on eligibility, skill overlap, and historical placement fit.",
        historicalPlacements: companyStats.placements,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { buildCompanyMatches, buildCompanyOutcomeStats };
