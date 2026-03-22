function countOverlap(studentSkills = [], companySkills = []) {
  const companySkillSet = new Set(companySkills.map((skill) => skill.toLowerCase()));
  return studentSkills.filter((skill) =>
    companySkillSet.has(skill.toLowerCase())
  ).length;
}

function buildCompanyMatches(student, companies) {
  const profile = student.profile || {};
  const skills = profile.skills || [];

  return companies
    .map((company) => {
      const matchedSkillCount = countOverlap(skills, company.requiredSkills || []);
      const eligibilityReasons = [];

      const eligibleCgpa = (profile.cgpa || 0) >= (company.minCgpa || 0);
      const eligibleBacklogs =
        company.maxBacklogs == null || (profile.backlogs || 0) <= company.maxBacklogs;

      if (eligibleCgpa) {
        eligibilityReasons.push("CGPA eligible");
      }

      if (matchedSkillCount > 0) {
        eligibilityReasons.push(`${matchedSkillCount} skill matches`);
      }

      const score =
        matchedSkillCount * 18 +
        Math.max(0, ((profile.cgpa || 0) - (company.minCgpa || 0)) * 10) +
        ((student.prediction?.placementProbability || 0) * 0.25);

      return {
        ...company,
        eligible: eligibleCgpa && eligibleBacklogs,
        matchedSkillCount,
        matchScore: Math.max(0, Math.min(100, Math.round(score))),
        eligibilityReasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

module.exports = { buildCompanyMatches };
